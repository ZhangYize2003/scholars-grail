import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from '../../login/page';
import SignUpPage from '../../signup/page';
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useSignInWithEmailAndPassword, useSignInWithGoogle } from 'react-firebase-hooks/auth';

jest.mock('@/firebase/config', () => ({
  __esModule: true,
  app: {},
  auth: {},
  db: { name: 'mocked-db' },
}));

// Simulate signing in/up function with email and password + Google
jest.mock('react-firebase-hooks/auth', () => ({
  useSignInWithEmailAndPassword: jest.fn(),
  useSignInWithGoogle: jest.fn(() => [jest.fn(), null]),
  useCreateUserWithEmailAndPassword: jest.fn(),
}));

// mocks useRouter to simulate page navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
}));

describe('Login functionality', () => {
  const mockPush = jest.fn(); // render sign in / home page
  const mockGoogleSignIn = jest.fn(); // mock Google sign in function
  let googleUser: { user: { uid: string } } | null = null;
  const signInMock = jest.fn(async () => ({
        user: { uid: 'test-uid' }
  }));

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSignInWithEmailAndPassword as jest.Mock).mockReturnValue([
      signInMock, // mocked signInWithEmailAndPassword
      null,
      false,
      null
    ]);

    googleUser = null;
    (useSignInWithGoogle as jest.Mock).mockImplementation(() => {
      return [mockGoogleSignIn, googleUser, false, null];
    });

    jest.clearAllMocks();
    localStorage.clear();
  });

  test('logs in and redirects to homepage', async () => {
    render(<SignInPage />);

    // fill in the form
    fireEvent.change(screen.getByPlaceholderText(/username or email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    // Click Sign In
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    // check localStorage update
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
    expect(localStorage.getItem('uid')).toBe('test-uid');
  });

  test('shows error when email or password is missing', async () => {
    const signInMock = jest.fn();
    (useSignInWithEmailAndPassword as jest.Mock).mockReturnValue([
      signInMock,
      null,
      false,
      null,
    ]);

    render(<SignInPage />);

    // click Sign In without filling the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for error message
    await waitFor(() => {
      expect(signInMock).not.toHaveBeenCalled();
    });
  });
  
  test('displays error if login fails', async () => {
    const signInMock = jest.fn().mockRejectedValue(new Error('Invalid username or password'));

    (useSignInWithEmailAndPassword as jest.Mock).mockReturnValue([
      signInMock,
      null,
      false,
      { code: 'auth/invalid-credential' } // Firebase error simulation
    ]);

    render(<SignInPage />);

    fireEvent.change(screen.getByPlaceholderText(/username or email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid username\/email or password/i)).toBeInTheDocument();
    });
  });

  test('signs in with Google', async () => {
    mockGoogleSignIn.mockImplementation(() => {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('uid', 'test-uid');
      googleUser = { user: { uid: 'test-uid' } };
      return googleUser;
    });

    render(<SignInPage />);

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    // check localStorage update
    expect(localStorage.getItem('isLoggedIn')).toBe('true');
    expect(localStorage.getItem('uid')).toBe('test-uid');
  });

});

describe('Sign Up functionality', () => {
  const mockCreateUser = jest.fn();

  beforeEach(() => {
    (useCreateUserWithEmailAndPassword as jest.Mock).mockReturnValue([
      mockCreateUser,
      null,
      false,
      null,
    ]);

    jest.clearAllMocks();
  });

  test('calls setDoc with correct data and stores data in firestore on successful sign up', async () => {
    mockCreateUser.mockResolvedValueOnce({
      user: { uid: '12345' },
    });
    const mockUserRef = { path: 'users/12345' };
    (doc as jest.Mock).mockReturnValue(mockUserRef);
    (setDoc as jest.Mock).mockResolvedValue(undefined);
    render(<SignUpPage />);

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(doc).toHaveBeenCalledWith(expect.anything(), 'users', '12345');
      expect(setDoc).toHaveBeenCalledWith(mockUserRef, {
        userName: 'testuser',
        email: 'test@example.com',
        createdAt: 'mocked-timestamp',
      });
    });
  });

  test('shows error if username or email is missing', async () => {
    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email address/i);

    expect(usernameInput).toBeInvalid();
    expect(emailInput).toBeInvalid();
  });
  
  test('shows error if passwords do not match', async () => {
    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
      target: { value: 'differentpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('shows error if email does not contain "@"', async () => {
    render(<SignUpPage />);

    // Fill in all required fields except with an invalid email
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalidemail.com' }, // no @
    });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm your password'), {
      target: { value: 'password123' },
    });

    // Try to submit
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // check email input is invalid
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInvalid();
  });
});