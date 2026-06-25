import pymupdf4llm

md = pymupdf4llm.to_markdown("bgbl1-50.pdf", pages=[17,18,19,20], force_ocr=True, ocr_language="de")
print(md)

#write to file 
with open("bgbl1-50.md", "w") as f:
    f.write(md)
