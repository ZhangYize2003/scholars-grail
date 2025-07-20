import { render, screen } from '@testing-library/react';
import RevisionProvider, { useRevisionContext } from '../../components/RevisionContext';
import React from 'react';

// Set context for subject, paper, working, and paperFolder
// This component will use the RevisionContext to set and display values
const ContextConsumer = () => {
  const {
    subject, setSubject,
    paper, setPaper,
    working, setWorking,
    paperFolder, setPaperFolder
  } = useRevisionContext();

  React.useEffect(() => {
    setSubject("Mathematics");
    setPaperFolder("2023/Paper 1");
    setPaper(new File(["paper content"], "paper.pdf", { type: "application/pdf" }));
    setWorking(new File(["working content"], "working.pdf", { type: "application/pdf" }));
  }, []);

  return (
    <div>
      <p data-testid="subject">{subject}</p>
      <p data-testid="paperFolder">{paperFolder}</p>
      <p data-testid="paper">{paper?.name || "none"}</p>
      <p data-testid="working">{working?.name || "none"}</p>
    </div>
  );
};

describe("RevisionContext", () => {
  // If useRevisionContext() is called outside of a <RevisionProvider> ->
  // Hook throws a custom error: "Context was used outside of provider!".
  test("throws error if used outside provider", () => {
    const BrokenComponent = () => {
      useRevisionContext(); // should throw
      return <div />;
    };

    expect(() => render(<BrokenComponent />)).toThrow("Context was used outside of provider!");
  });
  // Wraps ContextConsumer in RevisionProvider to provide context values
  test("updates context values properly", () => {
    render(
      <RevisionProvider>
        <ContextConsumer />
      </RevisionProvider>
    );

    expect(screen.getByTestId("subject")).toHaveTextContent("Mathematics");
    expect(screen.getByTestId("paperFolder")).toHaveTextContent("2023/Paper 1");
    expect(screen.getByTestId("paper")).toHaveTextContent("paper.pdf");
    expect(screen.getByTestId("working")).toHaveTextContent("working.pdf");
  });
});
