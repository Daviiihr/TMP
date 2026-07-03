import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RankingPage from '@/app/ranking/page';

describe('RankingPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    global.alert = vi.fn();
    vi.clearAllMocks();
  });

  const mockRankings = [
    { position: 1, username: 'Faker', country: 'Corea', points: 300, wins: 100, losses: 10 },
    { position: 2, username: 'Caps', country: 'España', points: 250, wins: 80, losses: 20 },
    { position: 3, username: 'Perkz', country: 'España', points: 200, wins: 65, losses: 25 },
    { position: 4, username: 'Jankos', country: 'Polonia', points: 150, wins: 50, losses: 30 }
  ];

  it('renders loading state initially and then lists rankings', async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({ ok: true, json: async () => ({ user: { username: 'Faker' } }) });
      }
      return fetchPromise;
    });

    render(<RankingPage />);
    
    expect(screen.getByText('Cargando la arena de competición...')).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({ ok: true, rankings: mockRankings })
    });

    await waitFor(() => {
      expect(screen.getAllByText('Faker').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Caps').length).toBeGreaterThan(0);
      // Podium should be rendered since there are >= 3 players
      expect(screen.getAllByText('Faker').length).toBeGreaterThan(1); // One in table, one in podium
    });
  });

  it('filters rankings by search query', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({ ok: true, json: async () => ({ user: { username: 'Faker' } }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, rankings: mockRankings })
      });
    });

    render(<RankingPage />);

    await waitFor(() => {
      expect(screen.getByText('Jankos')).toBeInTheDocument();
    });

    // Search for 'Caps'
    fireEvent.change(screen.getByPlaceholderText('Escribe el nombre de usuario...'), { target: { value: 'Caps' } });
    
    expect(screen.queryByText('Jankos')).not.toBeInTheDocument();
    expect(screen.getAllByText('Caps').length).toBeGreaterThan(0);
  });

  it('recalculates rankings when clicking the button', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/auth/login')) {
        return Promise.resolve({ ok: true, json: async () => ({ user: { username: 'Faker' } }) });
      }
      if (url.includes('/api/ranking/recalculate')) {
        return Promise.resolve({ ok: true, json: async () => ({ message: 'Recalculated successfully' }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ ok: true, rankings: mockRankings })
      });
    });

    render(<RankingPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Faker').length).toBeGreaterThan(0);
    });

    const recalcButton = screen.getByText('🔄 Recalcular / Sembrar Semillas');
    fireEvent.click(recalcButton);

    expect(screen.getByText('Actualizando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Recalculated successfully');
      expect(global.fetch).toHaveBeenCalledWith('/api/ranking/recalculate?seed=true', expect.any(Object));
    });
  });
});
