import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TournamentsPage from '@/app/tournaments/page';

describe('TournamentsPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.clearAllMocks();
  });

  const mockTournaments = [
    {
      id: '1',
      name: 'Copa Smash',
      game: 'Super Smash Bros',
      region: ['NA', 'LATAM'],
      max_players: 32,
      type: 'INDIVIDUAL',
      elimination_mode: 'DOUBLE_ELIMINATION',
      status: 'REGISTRATION',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'League of Legends Worlds',
      game: 'League of Legends',
      region: [],
      max_players: 16,
      type: 'TEAM',
      elimination_mode: 'SINGLE_ELIMINATION',
      status: 'IN_PROGRESS',
      created_at: new Date().toISOString()
    }
  ];

  it('renders loading state initially and then lists tournaments', async () => {
    let resolveFetch: any;
    const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
    (global.fetch as any).mockReturnValue(fetchPromise);

    render(<TournamentsPage />);
    
    expect(screen.getByText('Cargando torneos de la comunidad...')).toBeInTheDocument();

    resolveFetch({
      ok: true,
      json: async () => ({ ok: true, tournaments: mockTournaments })
    });

    await waitFor(() => {
      expect(screen.getByText('Copa Smash')).toBeInTheDocument();
      expect(screen.getByText('League of Legends Worlds')).toBeInTheDocument();
    });
  });

  it('filters tournaments based on search, type and status', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, tournaments: mockTournaments })
    });

    render(<TournamentsPage />);

    await waitFor(() => {
      expect(screen.getByText('Copa Smash')).toBeInTheDocument();
    });

    // Filter by name
    fireEvent.change(screen.getByPlaceholderText('Ej: Copa Smash, League of Legends...'), { target: { value: 'Smash' } });
    
    expect(screen.getByText('Copa Smash')).toBeInTheDocument();
    expect(screen.queryByText('League of Legends Worlds')).not.toBeInTheDocument();
    
    // Clear filter
    fireEvent.change(screen.getByPlaceholderText('Ej: Copa Smash, League of Legends...'), { target: { value: '' } });
    
    // Filter by type
    const typeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(typeSelect, { target: { value: 'TEAM' } });
    
    expect(screen.queryByText('Copa Smash')).not.toBeInTheDocument();
    expect(screen.getByText('League of Legends Worlds')).toBeInTheDocument();
  });

  it('displays empty state if no matches found', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, tournaments: [] })
    });

    render(<TournamentsPage />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron torneos.')).toBeInTheDocument();
    });
  });
});
