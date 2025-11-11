"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { genUploader } from 'uploadthing/client';
import type { OurFileRouter } from "../app/api/uploadthing/core";
import { compressImage } from '@/utils/imageCompression';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill: any = dynamic(
  async () => {
    const RQ = (await import('react-quill')).default as any;
    const ForwardedReactQuill = React.forwardRef(function ForwardedReactQuill(
      props: any,
      ref: React.Ref<any>
    ) {
      return <RQ ref={ref} {...props} />;
    });
    ForwardedReactQuill.displayName = 'ForwardedReactQuill';
    return ForwardedReactQuill;
  },
  { ssr: false }
);
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  height = "300px"
}) => {
  const quillRef = useRef<any>(null);

  const selectFile = (accept = 'image/*'): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = () => {
        const file = input.files && input.files[0] ? input.files[0] : null;
        resolve(file);
      };
      input.click();
    });
  };

  const uploadImageToCloud = async (file: File): Promise<string | null> => {
    try {
      const processed = file.type.startsWith('image/') ? await compressImage(file) : file;
      const { uploadFiles } = genUploader<OurFileRouter>();
      const res: any[] = await uploadFiles("mediaUploader", { files: [processed] });
      const url = res?.[0]?.url || res?.[0]?.fileUrl || null;
      return url;
    } catch (err) {
      console.error('Image upload failed:', err);
      return null;
    }
  };

  const insertImageAtSelection = (url: string, layoutClass: 'img-left' | 'img-block' = 'img-block') => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    const range = quill.getSelection(true);
    const index = range ? range.index : quill.getLength();
    const imgHtml = `<img src="${url}" alt="" class="${layoutClass}">`;
    quill.clipboard?.dangerouslyPasteHTML(index, imgHtml, 'user');
    quill.setSelection(index + 1, 0, 'silent');
    // Force propagate updated HTML to parent in controlled mode
    setTimeout(() => {
      const editor = quillRef.current?.getEditor?.();
      if (!editor) return;
      const html = editor.root.innerHTML;
      onChange(html);
    }, 0);
  };

  const handleInsertImageBesideText = async () => {
    const file = await selectFile('image/*');
    if (!file) return;
    const url = await uploadImageToCloud(file);
    if (url) insertImageAtSelection(url, 'img-left');
  };

  const handleInsertImageUnderText = async () => {
    const file = await selectFile('image/*');
    if (!file) return;
    const url = await uploadImageToCloud(file);
    if (url) insertImageAtSelection(url, 'img-block');
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ script: 'sub' }, { script: 'super' }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ direction: 'rtl' }],
        [{ align: [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        // Override default image handler to upload to cloud and insert as block
        image: () => {
          handleInsertImageUnderText();
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'blockquote', 'code-block'
  ];

  useEffect(() => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;

    const root: HTMLElement = quill.root;

    const handlePaste = async (e: any) => {
      const items = e.clipboardData?.items as DataTransferItemList | undefined;
      if (!items) return;
      const imageItem = Array.from(items).find((it: DataTransferItem) => it.type.startsWith('image/')) as DataTransferItem | undefined;
      if (imageItem) {
        e.preventDefault();
        const file = (imageItem as DataTransferItem).getAsFile();
        if (file) {
          const url = await uploadImageToCloud(file);
          if (url) insertImageAtSelection(url, 'img-block');
        }
      }
    };

    const handleDrop = async (e: any) => {
      if (!e.dataTransfer || !e.dataTransfer.files?.length) return;
      const filesList = e.dataTransfer.files as FileList;
      const file = Array.from(filesList).find((f: File) => f.type.startsWith('image/')) as File | undefined;
      if (file) {
        e.preventDefault();
        const url = await uploadImageToCloud(file as File);
        if (url) insertImageAtSelection(url, 'img-block');
      }
    };

    root.addEventListener('paste', handlePaste as any);
    root.addEventListener('drop', handleDrop as any);

    return () => {
      root.removeEventListener('paste', handlePaste as any);
      root.removeEventListener('drop', handleDrop as any);
    };
  }, []);

  return (
    <div className="rich-text-editor">
      <style jsx global>{`
        .ql-editor {
          min-height: ${height};
          font-size: 16px;
          line-height: 1.6;
        }
        .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
        }
        .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-top: none;
        }
        .ql-editor.ql-blank::before {
          color: #999;
          font-style: italic;
        }
        /* Editor-side layout classes for images */
        .ql-editor img.img-left {
          float: left;
          max-width: 320px;
          margin: 16px 16px 8px 0;
          display: inline-block;
        }
        .ql-editor img.img-block {
          display: block;
          max-width: 100%;
          margin: 16px 0;
          clear: both;
        }
      `}</style>
      {/* Custom controls for image layout */}
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={handleInsertImageBesideText}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
          title="Insert image beside text"
        >
          Image beside text
        </button>
        <button
          type="button"
          onClick={handleInsertImageUnderText}
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
          title="Insert image under text"
        >
          Image under text
        </button>
      </div>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        ref={quillRef}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;