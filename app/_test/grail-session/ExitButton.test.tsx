import { render, screen, fireEvent } from "@testing-library/react";
import Page from "@/app/grail-session/page";
import RevisionProvider from "@/app/components/RevisionContext";

const mockRouterPush = jest.fn();

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

  render(
    <RevisionProvider>
      <Page testOutput={mockOutput} />
    </RevisionProvider>
  );

  const exitBtn = screen.getByRole("button", { name: /exit/i });
  expect(exitBtn).toBeInTheDocument();

  // Simulate click and route change back to grail-session
  fireEvent.click(exitBtn);
  expect(mockRouterPush).toHaveBeenCalledWith("/grail-session");
});

test("does not render Exit button when output is not present", () => {
  render(
    <RevisionProvider>
      <Page testOutput={null} />
    </RevisionProvider>
  );

  const exitBtn = screen.queryByRole("button", { name: /exit/i });
  expect(exitBtn).not.toBeInTheDocument();
});