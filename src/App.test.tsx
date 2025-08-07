import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders prompt lab app', () => {
  render(<App />);
  // Test that the app renders with at least one "Prompt Lab" heading
  const headings = screen.getAllByText(/Prompt Lab/i);
  expect(headings.length).toBeGreaterThan(0);
  expect(headings[0]).toBeInTheDocument();
});
