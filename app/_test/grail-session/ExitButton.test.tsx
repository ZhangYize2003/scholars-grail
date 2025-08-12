import { render, screen, fireEvent } from "@testing-library/react";
import GrailSession from "@/app/components/GrailSession";
import RevisionProvider from "@/app/components/RevisionContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Need to add in queryclient as fetching is from useQuery now
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <RevisionProvider>{ui}</RevisionProvider>
    </QueryClientProvider>
  );
}

const mockRouterPush = jest.fn();
// Mock window.location.reload to prevent actual page reload during tests
beforeEach(() => {
  Object.defineProperty(window, "location", {
    value: {
      ...window.location,
      reload: jest.fn(),
    },
    writable: true,
  });
});

// Mock useRouter
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));


test("renders Exit button when output is present and handles click", () => {
  const mockOutput = {
    numberOfQuestions: 2,
    hints: ["Hint 1", "Hint 2"],
  };

  renderWithProviders(<GrailSession testOutput={mockOutput} />);

  const exitBtn = screen.getByRole("button", { name: /exit/i });
  expect(exitBtn).toBeInTheDocument();

  // Simulate click and route change back to grail-session
  fireEvent.click(exitBtn);
  expect(window.location.reload).toHaveBeenCalled();
});

test("does not render Exit button when output is not present", () => {
  renderWithProviders(<GrailSession testOutput={null}/>);

  const exitBtn = screen.queryByRole("button", { name: /exit/i });
  expect(exitBtn).not.toBeInTheDocument();
});