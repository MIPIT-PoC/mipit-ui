import { STATUS_CONFIG, RAIL_CONFIG } from '@/lib/constants';
import type { PaymentStatus } from '@/lib/types';

describe('STATUS_CONFIG', () => {
  const expectedStatuses: PaymentStatus[] = [
    'RECEIVED', 'VALIDATED', 'CANONICALIZED', 'ROUTED', 'QUEUED',
    'SENT_TO_DESTINATION', 'ACKED_BY_RAIL', 'COMPLETED',
    'FAILED', 'REJECTED', 'DUPLICATE',
  ];

  it('should have entries for all 11 payment statuses', () => {
    expect(Object.keys(STATUS_CONFIG).length).toBe(11);
  });

  expectedStatuses.forEach(status => {
    it(`should have config for ${status}`, () => {
      expect(STATUS_CONFIG[status]).toBeDefined();
      expect(STATUS_CONFIG[status].label).toBeTruthy();
      expect(STATUS_CONFIG[status].color).toMatch(/^bg-/);
    });
  });

  it('terminal success statuses should have positive step numbers', () => {
    expect(STATUS_CONFIG.COMPLETED.step).toBeGreaterThan(0);
  });

  it('terminal failure statuses should have step -1', () => {
    expect(STATUS_CONFIG.FAILED.step).toBe(-1);
    expect(STATUS_CONFIG.REJECTED.step).toBe(-1);
    expect(STATUS_CONFIG.DUPLICATE.step).toBe(-1);
  });

  it('steps should be monotonically increasing for pipeline statuses', () => {
    const pipeline: PaymentStatus[] = ['RECEIVED', 'VALIDATED', 'CANONICALIZED', 'ROUTED', 'QUEUED', 'SENT_TO_DESTINATION', 'ACKED_BY_RAIL', 'COMPLETED'];
    const steps = pipeline.map(s => STATUS_CONFIG[s].step);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    }
  });
});

describe('RAIL_CONFIG', () => {
  const expectedRails = ['PIX', 'SPEI', 'SWIFT_MT103', 'ISO20022_MX', 'ACH_NACHA', 'FEDNOW', 'BRE_B'];

  it('should have entries for all 7 supported rails', () => {
    expect(Object.keys(RAIL_CONFIG).length).toBe(7);
  });

  expectedRails.forEach(rail => {
    it(`should have config for ${rail}`, () => {
      const conf = RAIL_CONFIG[rail as keyof typeof RAIL_CONFIG];
      expect(conf).toBeDefined();
      expect(conf.label).toBeTruthy();
      expect(conf.flag).toBeTruthy();
      expect(conf.currency).toMatch(/^[A-Z]{3}$/);
    });
  });

  it('PIX should use BRL currency', () => {
    expect(RAIL_CONFIG.PIX.currency).toBe('BRL');
  });

  it('SPEI should use MXN currency', () => {
    expect(RAIL_CONFIG.SPEI.currency).toBe('MXN');
  });

  it('ACH_NACHA and FEDNOW should use USD currency', () => {
    expect(RAIL_CONFIG.ACH_NACHA.currency).toBe('USD');
    expect(RAIL_CONFIG.FEDNOW.currency).toBe('USD');
  });

  it('BRE_B should use COP currency and Colombia flag', () => {
    expect(RAIL_CONFIG.BRE_B.currency).toBe('COP');
    expect(RAIL_CONFIG.BRE_B.flag).toBe('🇨🇴');
    expect(RAIL_CONFIG.BRE_B.region).toBe('América del Sur');
  });
});
