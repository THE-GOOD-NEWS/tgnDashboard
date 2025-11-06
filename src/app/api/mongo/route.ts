import { NextResponse } from 'next/server';
import productsModel from '../../models/productsModel'; // Adjust path to your model
import { ConnectDB } from '@/config/db'; // Adjust path to your DB connection utility

interface ResponseData {
  message: string;
  updatedCount?: number;
  error?: string;
  debug?: any; // For debugging data structure
}

/**
 * POST handler for migrating product documents from images: string[] to images: media[]
 */
export async function POST() {
  try {
    // Connect to MongoDB
    await ConnectDB();

    // Find products where any variation has images that might be strings
    const products = await productsModel
      .find({
        $or: [
          { 'variations.images': { $type: 'string' } },
          { 'variations.images': { $elemMatch: { $type: 'string' } } },
        ],
      })
      .lean(); // Use lean() for faster querying

    console.log('Products to migrate:', products.length);
    if (products.length > 0) {
      console.log('Sample variations.images structures:');
      products.forEach((product, index) => {
        product.variations.forEach((variant: any, vIndex: number) => {
          console.log(
            `Product ${index + 1} (ID: ${product._id}), Variant ${vIndex + 1} (color: ${variant.color}):`,
            JSON.stringify(variant.images, null, 2)
          );
        });
      });
    }

    if (products.length === 0) {
      // Log all products for debugging
      const allProducts = await productsModel.find().lean();
      console.log('All products count:', allProducts.length);
      return NextResponse.json(
        {
          message: 'No products need migration',
          debug: allProducts.map((p: any) => ({
            _id: p._id,
            variations: p.variations.map((v: any) => ({ images: v.images })),
          })),
        },
        { status: 200 }
      );
    }

    let updatedCount = 0;

    // Process each product
    for (const product of products) {
      // Re-fetch as Mongoose document
      const mongooseProduct = await productsModel.findById(product._id);
      if (!mongooseProduct) {
        console.log(`Product ${product._id} not found for update`);
        continue;
      }

      let needsUpdate = false;
      const updatedVariations = mongooseProduct.variations.map((variant: any) => {
        // Log images structure and type
        console.log(
          `Checking product ${product._id}, variant ${variant.color}, images type: ${typeof variant.images}, value:`,
          JSON.stringify(variant.images)
        );

        // Check if images is an array
        if (Array.isArray(variant.images)) {
          // Check if any element is a string
          const hasStrings = variant.images.some((img: any) => typeof img === 'string');
          console.log(
            `Product ${product._id}, variant ${variant.color}, hasStrings: ${hasStrings}`
          );

          if (hasStrings) {
            needsUpdate = true;
            const updatedImages = variant.images.map((img: any) => {
              if (typeof img === 'string') {
                console.log(`Transforming string to media: ${img}`);
                return { url: img, type: 'image' };
              }
              console.log(`Preserving existing image:`, img);
              return img; // Preserve non-string elements
            });
            return { ...variant, images: updatedImages };
          } else {
            console.log(
              `Skipping variant ${variant.color}: no string elements in images`
            );
          }
        } else {
          console.log(
            `Skipping variant ${variant.color}: images is not an array, value:`,
            variant.images
          );
        }
        return variant;
      });

      if (needsUpdate) {
        mongooseProduct.variations = updatedVariations;
        // Mark nested array as modified
        mongooseProduct.markModified('variations');
        // Bypass validation for migration
        try {
          await mongooseProduct.save({ validateBeforeSave: false });
          updatedCount++;
          console.log(`Updated product ${product._id}`);
        } catch (saveError: any) {
          console.error(
            `Failed to save product ${product._id}:`,
            saveError.message
          );
        }
      } else {
        console.log(`No update needed for product ${product._id}`);
      }
    }

    // Fallback: Try direct MongoDB update if Mongoose save fails
    if (updatedCount === 0) {
      console.log('Attempting direct MongoDB update as fallback...');
      const updateResult = await productsModel.updateMany(
        {
          $or: [
            { 'variations.images': { $type: 'string' } },
            { 'variations.images': { $elemMatch: { $type: 'string' } } },
          ],
        },
        [
          {
            $set: {
              variations: {
                $map: {
                  input: '$variations',
                  as: 'variant',
                  in: {
                    $mergeObjects: [
                      '$$variant',
                      {
                        images: {
                          $map: {
                            input: '$$variant.images',
                            as: 'img',
                            in: {
                              $cond: {
                                if: { $eq: [{ $type: '$$img' }, 'string'] },
                                then: { url: '$$img', type: 'image' },
                                else: '$$img',
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ]
      );
      console.log('Direct update result:', updateResult);
      updatedCount += updateResult.modifiedCount || 0;
    }

    return NextResponse.json(
      {
        message: `Migration completed. Updated ${updatedCount} products.`,
        updatedCount,
        debug: products.map((p: any) => ({
          _id: p._id,
          variations: p.variations.map((v: any) => ({ images: v.images })),
        })),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { message: 'Migration failed', error: error.message },
      { status: 500 }
    );
  }
}