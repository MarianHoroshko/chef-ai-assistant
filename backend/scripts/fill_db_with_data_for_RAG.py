import os
import uuid

import pymupdf
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
from sentence_transformers import SentenceTransformer

load_dotenv()
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")


class QdrantIndexer:
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

        # Connect to Qdrant Cloud
        self.client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
        )

        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist."""

        if not self.client.collection_exists(self.collection_name):
            print(f"Creating collection: {self.collection_name}")

            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=384, distance=Distance.COSINE),
            )

    def chunk_text(self, text, chunk_size=700, overlap=100):
        """Standard recursive-style character chunking."""

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start += chunk_size - overlap

        return chunks

    def upsert_pdf(self, pdf_path: str):
        doc = pymupdf.open(pdf_path)
        all_points = []

        print(f"🚀 Processing PDF: {pdf_path}")

        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            chunks = self.chunk_text(text)

            # Vectorize all chunks for this page at once (faster than 1-by-1)
            embeddings = self.model.encode(chunks)

            for i, chunk in enumerate(chunks):
                if len(chunk.strip()) < 20:
                    continue

                # Use a deterministic UUID based on content to prevent duplicates
                point_id = str(
                    uuid.uuid5(uuid.NAMESPACE_DNS, f"{pdf_path}_{page_num}_{i}")
                )

                all_points.append(
                    PointStruct(
                        id=point_id,
                        vector=embeddings[i].tolist(),
                        payload={
                            "text": chunk,
                            "metadata": {
                                "source": os.path.basename(pdf_path),
                                "page": page_num + 1,
                            },
                        },
                    )
                )

        # Cloud tip: Use upsert in batches to avoid timeout on huge PDFs
        batch_size = 100
        for i in range(0, len(all_points), batch_size):
            self.client.upsert(
                collection_name=self.collection_name,
                points=all_points[i : i + batch_size],
            )

        print(f"✅ Finished! Indexed {len(all_points)} chunks from {pdf_path}")


if __name__ == "__main__":
    # Ensure these are set in your environment or .env file
    if not QDRANT_URL or not QDRANT_API_KEY:
        print("Error: Please set QDRANT_URL and QDRANT_API_KEY environment variables.")
    else:
        indexer = QdrantIndexer("chef_ai_assistant_recipes")
        indexer.upsert_pdf("rag_data/recipes.pdf")
