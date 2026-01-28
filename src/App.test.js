import { render, screen } from '@testing-library/react';
import App from './App';
import { supabase } from './utils/supabaseClient';

// Mock Supabase client
jest.mock('./utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

test('renders the login screen when not authenticated', async () => {
  render(<App />);
  // The app shows "Loading..." initially
  const loadingElement = screen.getByText(/Loading/i);
  expect(loadingElement).toBeInTheDocument();

  // After a bit, it should show login
  const loginHeading = await screen.findByText(/ברוכים הבאים/i);
  expect(loginHeading).toBeInTheDocument();
});
