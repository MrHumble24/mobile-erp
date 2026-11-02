import { Injectable } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';
import { QcLookupsRepository } from './qc-lookups.repository.js';
import {
  DateRange,
  DefectCount,
  QcStatsRepository,
  ResultCount,
} from './qc-stats.repository.js';
import { QcStatsView } from './types/qc.types.js';

@Injectable()
export class QcStatsService {
  constructor(
    private readonly stats: QcStatsRepository,
    private readonly lookups: QcLookupsRepository,
    private readonly devices: DevicesService,
  ) {}

  async get(query: StatsQueryDto): Promise<QcStatsView> {
    const range = toRange(query);
    const [results, byGrade, defects, avgBatteryHealth, awaiting, defectTypes] =
      await Promise.all([
        this.stats.countsByResult(range),
        this.stats.byGrade(range),
        this.stats.topDefects(range),
        this.stats.avgBattery(range),
        this.devices.countAwaitingInspection(),
        this.lookups.listDefectTypes(true),
      ]);

    const { passed, failed } = splitResults(results);
    const inspected = passed + failed;
    const labels = new Map(defectTypes.map((d) => [d.code, d.label]));

    return {
      inspected,
      passed,
      failed,
      passRate: inspected === 0 ? 0 : round(passed / inspected, 4),
      byGrade,
      topDefects: defects.map((d) => withLabel(d, labels)),
      avgBatteryHealth:
        avgBatteryHealth === null ? null : round(avgBatteryHealth, 1),
      awaitingInspection: awaiting,
    };
  }
}

function splitResults(results: ResultCount[]): {
  passed: number;
  failed: number;
} {
  const passed = results.find((r) => r.passed)?.count ?? 0;
  const failed = results.find((r) => !r.passed)?.count ?? 0;
  return { passed, failed };
}

function withLabel(defect: DefectCount, labels: Map<string, string>) {
  return {
    defectCode: defect.defectCode,
    label: labels.get(defect.defectCode) ?? defect.defectCode,
    count: defect.count,
  };
}

function toRange(query: StatsQueryDto): DateRange {
  return {
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  };
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
