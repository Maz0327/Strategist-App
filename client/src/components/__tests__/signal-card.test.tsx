import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignalCard } from '../SignalCard';

const mockSignal = {
  id: 1,
  userId: 1,
  title: 'Test Signal',
  content: 'Test content',
  url: 'https://example.com',
  summary: 'Test summary',
  sentiment: 'positive' as const,
  tone: 'professional' as const,
  keywords: ['test', 'signal'],
  tags: ['technology'],
  confidence: '95%',
  status: 'capture' as const,
  truthFact: 'Test fact',
  truthObservation: 'Test observation',
  truthInsight: 'Test insight',
  humanTruth: 'Test human truth',
  culturalMoment: 'Test cultural moment',
  attentionValue: 'high' as const,
  platformContext: 'Test platform context',
  viralPotential: 'high' as const,
  cohortSuggestions: ['millennials', 'tech-savvy'],
  competitiveInsights: ['insight1', 'insight2'],
  nextActions: null,
  userNotes: '',
  promotionReason: null,
  systemSuggestionReason: null,
  flaggedAt: null,
  promotedAt: null,
  isDraft: false,
  capturedAt: null,
  browserContext: null,
  createdAt: '2024-01-15T10:00:00Z',
};

describe('SignalCard', () => {
  it('renders signal information correctly', () => {
    render(
      <SignalCard 
        signal={mockSignal} 
        onPromote={vi.fn()} 
        onUpdate={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText('Test Signal')).toBeInTheDocument();
    expect(screen.getByText('Test summary')).toBeInTheDocument();
    expect(screen.getByText('positive')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('displays status badge correctly', () => {
    render(
      <SignalCard 
        signal={mockSignal} 
        onPromote={vi.fn()} 
        onUpdate={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText('capture')).toBeInTheDocument();
  });

  it('shows keywords as tags', () => {
    render(
      <SignalCard 
        signal={mockSignal} 
        onPromote={vi.fn()} 
        onUpdate={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('signal')).toBeInTheDocument();
  });

  it('calls onPromote when promote button is clicked', () => {
    const mockOnPromote = vi.fn();
    render(
      <SignalCard 
        signal={mockSignal} 
        onPromote={mockOnPromote} 
        onUpdate={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    const promoteButton = screen.getByRole('button', { name: /promote/i });
    fireEvent.click(promoteButton);
    
    expect(mockOnPromote).toHaveBeenCalledWith(mockSignal.id, "");
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    render(
      <SignalCard 
        signal={mockSignal} 
        onPromote={vi.fn()} 
        onUpdate={vi.fn()} 
        onDelete={mockOnDelete} 
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockSignal.id);
  });

  it('displays URL when present', () => {
    render(
      <SignalCard 
        signal={mockSignal} 
        onPromote={vi.fn()} 
        onUpdate={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText('View Source')).toBeInTheDocument();
  });

  it('handles different sentiment colors', () => {
    const negativeSignal = { ...mockSignal, sentiment: 'negative' as const };
    render(
      <SignalCard 
        signal={negativeSignal} 
        onPromote={vi.fn()} 
        onUpdate={vi.fn()} 
        onDelete={vi.fn()} 
      />
    );
    
    expect(screen.getByText('negative')).toBeInTheDocument();
  });
});