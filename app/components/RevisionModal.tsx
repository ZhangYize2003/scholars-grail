"use client";
import { useState } from "react";
import S3UploadForm from './S3UploadForm';
import S3UploadForm2 from './S3UploadForm2';

const RevisionModal = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openModal2, setOpenModal2] = useState(false);

  return (
    <div className="flex flex-col items-center space-y-2 text-main">
        <button onClick={() => setOpenModal(true)} 
                className="flex p-2 mx-2 bg-accent text-xl rounded-md hover:bg-accent/75 transition cursor-pointer">
            start revision
        </button>
        <hr className="border-t border-stroke w-1/2 my-2"></hr>
        {openModal && <S3UploadForm setOpenModal={setOpenModal} setOpenModal2={setOpenModal2}/>}
        {openModal2 && <S3UploadForm2 setOpenModal2={setOpenModal2}/>}
    </div>
  );
}

export default RevisionModal;