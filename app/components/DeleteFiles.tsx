"use client";
import React from "react";

interface DeleteFileProps {
  fileKey: string;
  onDelete?: () => void;
}

const DeleteFile: React.FC<DeleteFileProps> = ({ fileKey, onDelete }) => {
  if (!fileKey) return null;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    await fetch(`/api/s3-delete?key=${encodeURIComponent(fileKey)}`, {
      method: "DELETE",
    });
    if (onDelete) onDelete();
  };

  return (
    <button
      onClick={handleDelete}
      className="flex gap-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
    >
      Delete
    </button>
  );
};

export default DeleteFile;