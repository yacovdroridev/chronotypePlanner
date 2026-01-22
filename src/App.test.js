import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./appLogic', () => ({
  initApp: jest.fn(),
}));

test('renders the login screen heading', () => {
  render(<App />);
  expect(screen.getByText('ברוכים הבאים')).toBeTruthy();
});
