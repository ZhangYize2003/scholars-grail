"use client";
const routerReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplace,
  }),
}));
import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act } from 'react';
import S3UploadForm from "../../components/S3UploadForm";
import S3UploadForm2 from "../../components/S3UploadForm2";
import RevisionProvider from "../../components/RevisionContext";
import userEvent from '@testing-library/user-event';

beforeEach(() => {
  localStorage.setItem("uid", "test-user");
  jest.spyOn(window, "alert").mockImplementation(() => {});
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ folders: [], files: [] }),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders the S3UploadForm without crashing", async () => {
  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={() => {}} setOpenModal2={() => {}} />
    </RevisionProvider>
  );
  
  expect(screen.getByText("Start revision")).toBeInTheDocument();
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  })
});

test("switches to device upload when 'Upload from device' is clicked", async () => {
  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={() => {}} setOpenModal2={() => {}} />
    </RevisionProvider>
  );
  fireEvent.click(screen.getByLabelText("Upload from device"));
  expect(screen.getByText("choose file")).toBeInTheDocument();
  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalled();
  });
});

// Helper -> Create mock file
const createMockFile = (name: string, type: string, content: string) => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: blob.size });
  return file;
};

// Helper -> Uploads pdf
async function uploadPdfFromDevice(file: File, fileContent: string) {
  const readerMock: Partial<FileReader> = {
    result: fileContent,
    onload: null,
    readAsText: function () {
      // @ts-expect-error bc onload exists
      this.onload();
    },
  };

  global.FileReader = jest.fn(() => readerMock) as unknown as typeof FileReader;

  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={() => {}} setOpenModal2={() => {}} />
    </RevisionProvider>
  );

  fireEvent.click(screen.getByLabelText("Upload from device"));
  const fileInput = screen.getByTestId("file-input");
  fireEvent.change(fileInput, { target: { files: [file] } });
}

// Accepts less than 10 pages
test("accepts PDF with less than 10 pages", async () => {
  const PagesContent = Array(3).fill("/Type /Page").join("\n");
  const file = createMockFile("test.pdf", "application/pdf", PagesContent);
  await uploadPdfFromDevice(file, PagesContent);
  await waitFor(() =>
    expect(screen.getByText(`File name: ${file.name}`)).toBeInTheDocument()
  );
});

// Rejects more than 10 pages
test("rejects PDF with more than 10 pages", async () => {
  const PagesContent = Array(12).fill("/Type /Page").join("\n");
  const file = createMockFile("test.pdf", "application/pdf", PagesContent);
  await uploadPdfFromDevice(file, PagesContent);
  await waitFor(() =>
    expect(window.alert).toHaveBeenCalledWith(
      "You can only upload PDF files with 10 pages or fewer."
    )  
  );
});

test("user cannot proceed without selecting a subject and paper", async () => {
  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={() => {}} setOpenModal2={() => {}} />
    </RevisionProvider>
  );

  const submitBtn = screen.getByText("Next").closest("button")!;
  expect(submitBtn).toBeDisabled();
  await waitFor(() =>
    expect(submitBtn).toBeDisabled()
  );
});

test("user can select an existing subject", async () => {
  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={() => {}} setOpenModal2={() => {}} />
    </RevisionProvider>
  );
  const PagesContent = Array(3).fill("/Type /Page").join("\n");
  const file = createMockFile("test.pdf", "application/pdf", PagesContent);
  await uploadPdfFromDevice(file, PagesContent);
  await waitFor(() => {
    expect(screen.getByText(`File name: ${file.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Upload to:`)).toBeInTheDocument();
  });
  
  const allButtons = screen.getAllByTestId("current-subject-input");
  await userEvent.click(allButtons[0]);
  const dropdown = screen.getAllByTestId("current-subject-input");
  await waitFor(() => {
    expect(dropdown[1]).toBeInTheDocument();
    userEvent.selectOptions(dropdown[1], "— Choose Subject —");
  });
});

test("user can create new subject and proceed to modal 2", async () => {
  const setOpenModal = jest.fn();
  const setOpenModal2 = jest.fn();
  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={setOpenModal} setOpenModal2={setOpenModal2} />
    </RevisionProvider>
  );
  const PagesContent = Array(3).fill("/Type /Page").join("\n");
  const file = createMockFile("test.pdf", "application/pdf", PagesContent);
  await uploadPdfFromDevice(file, PagesContent);
  await waitFor(() => {
    expect(screen.getByText(`File name: ${file.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Upload to:`)).toBeInTheDocument();
  });

  const textbox = screen.getByTestId("new-subject-input");
  await userEvent.type(textbox, "New Subject");
  await waitFor(() => {
    expect(textbox).toHaveValue("New Subject");
  });
  const allNextButtons = screen.getAllByTestId("next-button");
  const enabledNextButton = allNextButtons.find((btn) => !btn.hasAttribute("disabled"));

  if (!enabledNextButton) {
    throw new Error("No enabled Next button found");
  }

  await userEvent.click(enabledNextButton);
  await waitFor(() => {
    expect(screen.getByText(`File uploaded successfully!`)).toBeInTheDocument();
  });
});

test("user can skip workings upload by selecting 'No' and proceed to grail-session", async () => {
  const setOpenModal2 = jest.fn();
  render(
    <RevisionProvider>
      <S3UploadForm2 setOpenModal2={setOpenModal2} />
    </RevisionProvider>
  );

  // Select the "No" radio option
  const noOption = screen.getByLabelText(/No — Revise with Scholar's Grail/i);
  fireEvent.click(noOption);

  // Click "Next"
  const nextButton = screen.getByRole("button", { name: /next/i });
  fireEvent.click(nextButton);

  // Assert navigation
  await waitFor(() => {
    expect(routerReplace).toHaveBeenCalledWith("/grail-session");
  });
});

test("user can upload workings and it redirects to grail-session", async () => {
  const setOpenModal2 = jest.fn();

  render(
    <RevisionProvider>
      <S3UploadForm2 setOpenModal2={setOpenModal2} />
    </RevisionProvider>
  );

  // select the "Yes" radio option
  fireEvent.click(screen.getByLabelText(/Yes — Upload your working/i));

  const PagesContent = Array(3).fill("/Type /Page").join("\n");
  const file = createMockFile("test.pdf", "application/pdf", PagesContent);

  await uploadPdfFromDevice(file, PagesContent);

  await waitFor(() =>
    expect(screen.getByText(`File name: ${file.name}`)).toBeInTheDocument()
  );

  fireEvent.click(screen.getByTestId("next-button"));

  // Since setTimeout for 1 second, must advance timers:
  jest.useFakeTimers();

  // Advance timers inside act
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });

  expect(routerReplace).toHaveBeenCalledWith("/grail-session");

  jest.useRealTimers();
});

test("user can cancel upload and close modal", async () => {
  const setOpenModal = jest.fn();
  const setOpenModal2 = jest.fn();
  render(
    <RevisionProvider>
      <S3UploadForm setOpenModal={setOpenModal} setOpenModal2={setOpenModal2} />
    </RevisionProvider>
  );

  const cancelButton = screen.getByRole("button", { name: /cancel/i });
  fireEvent.click(cancelButton);
  
  await waitFor(() => {
    expect(screen.getByText("Start revision")).toBeInTheDocument();
  });
});