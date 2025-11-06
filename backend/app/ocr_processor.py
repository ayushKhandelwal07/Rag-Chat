from docling.document_converter import DocumentConverter
import os

def process_pdf(file_path: str) -> dict:
    """Extract text from PDF with OCR"""
    converter = DocumentConverter()
    result = converter.convert(file_path)
    doc = result.document
    
    if hasattr(doc, 'export_to_markdown'):
        text = doc.export_to_markdown()
    elif hasattr(doc, 'export_to_text'):
        text = doc.export_to_text()
    else:
        text_parts = []
        if hasattr(doc, 'pages'):
            for page in doc.pages:
                if hasattr(page, 'text'):
                    text_parts.append(page.text)
        text = "\n\n".join(text_parts) if text_parts else str(doc)
    
    return {
        "text": text,
        "filename": os.path.basename(file_path)
    }

