import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {generateHints} from '../../utils/generateHints'
import UploadWorking from '../../components/UploadWorking';

import { act } from 'react';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ text: "Mocked PDF text", boundingBoxes: [], hints: [] }),
  })
) as jest.Mock;

beforeEach(() => {
  const localStorageMock = (function () {
    let store: { [key: string]: string } = {};
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value.toString();
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  window.localStorage.setItem('uid', 'mocked-uid');
});

jest.mock("../../components/RevisionContext", () => ({
  useRevisionContext: () => ({
    subject: "Math",
    paperFolder: "2023 Paper 1",
    setSubject: jest.fn(),
    setPaperFolder: jest.fn(),
    paper: null,
    working: null,
    setPaper: jest.fn(),
    setWorking: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

const createMockFile = (name: string, type: string, content: string) => {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: blob.size });
  return file;
};

// // FolderSelector Component
// describe('FolderSelector Component', () => {
//   let mockFetch: jest.Mock;
//   const onFolderSelect = jest.fn();

//   beforeEach(() => {
//     localStorageMock.clear();
//     localStorageMock.setItem('uid', 'ATF2j9GrCiSlFqrCu5eEjAJgtE52');

//     mockFetch = jest.fn((url: string) => {
//     if (url.includes('/api/s3-render?uid=ATF2j9GrCiSlFqrCu5eEjAJgtE52&prefix=')) {
//         return Promise.resolve({
//         ok: true,
//         json: () => Promise.resolve({
//             folders: [
//             { prefix: 'usersData/ATF2j9GrCiSlFqrCu5eEjAJgtE52/English/mcq/' }, // <- subfolder now in folders
//             ]
//         }),
//         });
//     }

//     if (url.includes('/api/s3-render?uid=ATF2j9GrCiSlFqrCu5eEjAJgtE52')) {
//         return Promise.resolve({
//         ok: true,
//         json: () => Promise.resolve({
//             folders: [
//             { prefix: 'usersData/ATF2j9GrCiSlFqrCu5eEjAJgtE52/English/' }, // subject folder
//             ]
//         }),
//         });
//     }

//     return Promise.reject(new Error(`Unhandled fetch request for URL: ${url}`));
//     });

//     global.fetch = mockFetch;
//   });

//   it('renders the component and fetches subjects and subfolders', async () => {
//     render(<FolderSelector onFolderSelect={onFolderSelect} parsing={false} refreshkey={0} />);

//     const subjectLabel = await screen.findByLabelText('Select Subject');
//     expect(subjectLabel).toBeInTheDocument();
//     const subjectOption = await screen.findByText('Choose a subject');
//     expect(subjectOption).toBeInTheDocument();

//     fireEvent.change(subjectLabel, { target: { value: 'English' } });

//     const folderLabel = await screen.findByLabelText('Select Folder');
//     expect(folderLabel).toBeInTheDocument();
//     const folderOption = await screen.findByText('Choose a folder');
//     expect(folderOption).toBeInTheDocument();

//   });
// });

// Check if working can be dropped and uploaded
test("should allow working upload and display uploaded file", async () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  await act(async () => {
    render(<UploadWorking/>);
  });

  const PagesContent = Array(3).fill("/Type /Page").join("\n");
  const file = createMockFile("test.pdf", "application/pdf", PagesContent);
  // Drop file into dropzone
  const dropzone = screen.getByTestId("dropzone");
  const data = {
    dataTransfer: {
      files: [file],
      items: [
        {
          kind: 'file',
          type: 'application/pdf',
          getAsFile: () => file,
        },
      ],
    },
  };
  await act(async () => {
    fireEvent.drop(dropzone, data);
  });

  // // Cant see marking as it is not "mock" uploading
  // await waitFor(() => {
  //   expect(screen.getByText("Marking...")).toBeInTheDocument();
  // });

  //read console.log to check if file dropped and working uploaded successfully
  await waitFor(() => {
    const firstLog = consoleSpy.mock.calls[0][0];
    const fourthLog = consoleSpy.mock.calls[3][0];
    expect(firstLog).toContain("File dropped:");
    expect(fourthLog).toContain("Working uploaded successfully:");
  });

  consoleSpy.mockRestore(); 
});


// Generate hints -> Gemini API working
describe("generateHints", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          numberOfQuestions: 3,
          hints: ['Hint 1', 'Hint 2', 'Hint 3']
        }),
      })
    ) as jest.Mock;
  });

  it("gemini correctly returns hints", async () => {
    const pdfText = "Q1. ... Q2. ... Q3. ...";
    const result = await generateHints(pdfText);

    expect(result.numberOfQuestions).toBe(3);
    expect(result.hints.length).toBe(3);
    expect(result.hints[0]).toContain("Hint");
  });

  it("throws error if fetch fails", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false })
    );

    await expect(generateHints("Some text")).rejects.toThrow("Failed to generate hints.");
  });
});