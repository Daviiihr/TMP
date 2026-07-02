import { describe, it, expect, vi } from 'vitest';
import { AppEventEmitter, Observer, AppEvents } from '@/observers/event-emitter';

describe('AppEventEmitter', () => {
  it('should register and execute observers on emit', async () => {
    const emitter = new AppEventEmitter();
    
    const mockObserver: Observer<'tournament:statusChanged'> = {
      update: vi.fn(),
    };
    
    emitter.on('tournament:statusChanged', mockObserver);
    
    const data: AppEvents['tournament:statusChanged'] = {
      tournamentId: 't1',
      oldStatus: 'DRAFT',
      newStatus: 'IN_PROGRESS',
      userId: 'u1'
    };
    
    await emitter.emit('tournament:statusChanged', data);
    
    expect(mockObserver.update).toHaveBeenCalledWith('tournament:statusChanged', data);
  });

  it('should remove observer on off', async () => {
    const emitter = new AppEventEmitter();
    
    const mockObserver: Observer<'tournament:statusChanged'> = {
      update: vi.fn(),
    };
    
    emitter.on('tournament:statusChanged', mockObserver);
    emitter.off('tournament:statusChanged', mockObserver);
    
    await emitter.emit('tournament:statusChanged', { tournamentId: 't1', oldStatus: 'a', newStatus: 'b', userId: 'u1' });
    
    expect(mockObserver.update).not.toHaveBeenCalled();
  });
});
