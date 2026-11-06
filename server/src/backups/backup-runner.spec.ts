import { BackupRunner } from './backup-runner.js';

/** Access the private helpers without running the whole pg_dump pipeline. */
type Testable = {
  sendEverywhere(
    runId: string,
    codes: string[],
    file: unknown,
  ): Promise<boolean>;
  applyRetention(code: string, keepLast: number): Promise<void>;
};

function make(
  adapters: Record<
    string,
    { upload?: unknown; remove?: unknown; capabilities?: unknown }
  >,
) {
  const targets: { code: string; status: string; error?: string }[] = [];
  const removed: string[] = [];
  const recorded: { code: string; ok: boolean }[] = [];
  const repo = {
    createTarget: jest.fn((runId: string, code: string) =>
      Promise.resolve({ id: `t-${code}` }),
    ),
    updateTarget: jest.fn(
      (id: string, data: { statusCode: string; error?: string }) => {
        targets.push({
          code: id.replace('t-', ''),
          status: data.statusCode,
          error: data.error,
        });
        return Promise.resolve({});
      },
    ),
    uploadedTargets: jest.fn().mockResolvedValue([]),
    deleteTarget: jest.fn((id: string) => {
      removed.push(id);
      return Promise.resolve({});
    }),
    deleteOrphanRuns: jest.fn().mockResolvedValue({}),
  };
  const registry = {
    has: (c: string) => c in adapters,
    get: (c: string) => ({
      capabilities: adapters[c].capabilities ?? {
        delete: false,
        download: true,
      },
      upload: adapters[c].upload ?? (() => Promise.resolve({ ref: 'r' })),
      remove: adapters[c].remove ?? (() => Promise.resolve()),
    }),
    codes: () => Object.keys(adapters),
  };
  const providers = {
    recordResult: jest.fn((code: string, ok: boolean) => {
      recorded.push({ code, ok });
      return Promise.resolve();
    }),
  };
  const destination = {
    resolve: jest.fn().mockResolvedValue({ config: {}, secret: {} }),
  };
  const runner = new BackupRunner(
    repo as never,
    registry as never,
    {} as never,
    {} as never,
    providers as never,
    destination as never,
  );
  return {
    runner: runner as unknown as Testable,
    repo,
    targets,
    removed,
    recorded,
  };
}

describe('BackupRunner.sendEverywhere', () => {
  it('a remote failure leaves the run partly failed with LOCAL intact', async () => {
    const { runner, targets, recorded } = make({
      LOCAL: { upload: () => Promise.resolve({ ref: 'local.mbk' }) },
      TELEGRAM: { upload: () => Promise.reject(new Error('chat gone')) },
    });
    const localOk = await runner.sendEverywhere('run1', ['LOCAL', 'TELEGRAM'], {
      path: 'f',
      name: 'n',
      sizeBytes: 1,
    });
    expect(localOk).toBe(true);
    expect(targets).toContainEqual({
      code: 'LOCAL',
      status: 'UPLOADED',
      error: undefined,
    });
    expect(targets.find((t) => t.code === 'TELEGRAM')?.status).toBe('FAILED');
    expect(recorded).toContainEqual({ code: 'LOCAL', ok: true });
    expect(recorded).toContainEqual({ code: 'TELEGRAM', ok: false });
  });

  it('reports LOCAL failure so the run fails', async () => {
    const { runner } = make({
      LOCAL: { upload: () => Promise.reject(new Error('disk full')) },
    });
    expect(
      await runner.sendEverywhere('run1', ['LOCAL'], {
        path: 'f',
        name: 'n',
        sizeBytes: 1,
      }),
    ).toBe(false);
  });
});

describe('BackupRunner.applyRetention', () => {
  it('skips a place that cannot delete', async () => {
    const { runner, repo } = make({
      TELEGRAM: { capabilities: { delete: false } },
    });
    await runner.applyRetention('TELEGRAM', 1);
    expect(repo.uploadedTargets).not.toHaveBeenCalled();
  });

  it('removes copies beyond keepLast where the place can delete', async () => {
    const { runner, repo, removed } = make({
      LOCAL: {
        capabilities: { delete: true },
        remove: () => Promise.resolve(),
      },
    });
    repo.uploadedTargets.mockResolvedValue([
      { id: 'a', remoteRef: 'a.mbk' },
      { id: 'b', remoteRef: 'b.mbk' },
      { id: 'c', remoteRef: 'c.mbk' },
    ]);
    await runner.applyRetention('LOCAL', 1); // keep newest 1, delete b + c
    expect(removed).toEqual(['b', 'c']);
  });
});
