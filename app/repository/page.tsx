"use client";
import S3UploadForm from '../components/S3UploadForm';
import S3RenderFile from '../components/S3RenderFile';
import Header from '../home/header';
export default function Page() {
  return (
    <div className="min-h-screen">
        <Header />
      <h1 className="pt-20 text-gray-200">Upload and View Files</h1>
      <div>
        <S3UploadForm />
      </div>
      <div className="mt-8">
        <S3RenderFile />
      </div>
    </div>
  );
}
