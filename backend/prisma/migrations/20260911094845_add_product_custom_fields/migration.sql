-- CreateTable
CREATE TABLE "ProductCustomField" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProductCustomField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCustomField_productId_idx" ON "ProductCustomField"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCustomField_productId_key_key" ON "ProductCustomField"("productId", "key");

-- AddForeignKey
ALTER TABLE "ProductCustomField" ADD CONSTRAINT "ProductCustomField_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
