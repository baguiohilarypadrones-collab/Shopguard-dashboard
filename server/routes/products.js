import { Router } from 'express';
import Product from '../models/Product.js';
import Seller from '../models/Seller.js';

const router = Router();

// ========================================
// GET ALL PRODUCTS
// GET /api/products
// ========================================

router.get('/', async (req, res) => {
  try {

    const {
      search,
      status,
      platform,
      category,
      limit = 100
    } = req.query;

    const filter = {};

    // SEARCH
    if (search) {

      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          sellerName: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          category: {
            $regex: search,
            $options: 'i'
          }
        }
      ];
    }

    // STATUS
    if (status) {
      filter.status = status;
    }

    // PLATFORM
    if (platform) {
      filter.platform = platform;
    }

    // CATEGORY
    if (category) {
      filter.category = category;
    }

    const products =
      await Product.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .lean();

    res.json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// GET PRODUCT STATS
// GET /api/products/stats
// ========================================

router.get('/stats', async (req, res) => {
  try {

    const total =
      await Product.countDocuments();

    const verified =
      await Product.countDocuments({
        status: 'verified'
      });

    const bogus =
      await Product.countDocuments({
        status: 'bogus'
      });

    const pending =
      await Product.countDocuments({
        status: 'pending'
      });

    res.json({
      total,
      verified,
      bogus,
      pending
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// GET PRODUCT BY ID
// GET /api/products/:id
// ========================================

router.get('/:id', async (req, res) => {
  try {

    const product =
      await Product.findById(
        req.params.id
      ).lean();

    if (!product) {

      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json(product);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// CREATE PRODUCT
// POST /api/products
// ========================================

router.post('/', async (req, res) => {
  try {

    const {
      name,
      price,
      image,
      category,
      platform,
      rating,
      reviews,
      url,
      sellerName,
      sellerId,
      status: incomingStatus
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!name) {

      return res.status(400).json({
        error: 'Product name is required'
      });
    }

    if (!price || price <= 0) {

      return res.status(400).json({
        error: 'Valid product price required'
      });
    }

    // ========================================
    // CHECK DUPLICATE
    // ========================================

    const existing =
      await Product.findOne({
        url
      });

    if (existing) {

      return res.json({
        success: false,
        message: 'Product already exists',
        product: existing
      });
    }

    // ========================================
    // AUTO DETECT STATUS
    // ========================================

    let status =
      incomingStatus || 'verified';

    // LazMall auto verified
    const isLazMall =
      (sellerName || '')
        .toLowerCase()
        .includes('mall');

    // suspicious seller keywords
    const suspiciousSellers = [
      'flashsale',
      'quickdeal',
      'cheapshop',
      'freeshipping',
      'limiteddeal'
    ];

    const lowerSeller =
      (sellerName || '')
        .toLowerCase();

    const suspicious =
      suspiciousSellers.some(keyword =>
        lowerSeller.includes(keyword)
      );

    // only bogus if highly suspicious
    if (
      !isLazMall &&
      (
        (rating > 0 && rating < 2.5) ||
        (
          reviews > 0 &&
          reviews < 3 &&
          suspicious
        )
      )
    ) {
      status = 'bogus';
    }

    // ========================================
    // CREATE OR UPDATE SELLER
    // ========================================

    if (sellerName) {

      const existingSeller =
        await Seller.findOne({
          name: sellerName
        });

      if (!existingSeller) {

        await Seller.create({

          name: sellerName,

          platform:
            platform || 'Lazada',

          products: 1,

          reports:
            status === 'bogus'
              ? 1
              : 0,

          rating:
            rating || 0,

          status:
            status === 'bogus'
              ? 'flagged'
              : 'verified',

          reason:
            status === 'bogus'
              ? 'Suspicious products detected'
              : '',

          url: url || ''
        });

      } else {

        // increment product count
        existingSeller.products += 1;

        // update rating average
        existingSeller.rating =
          (
            existingSeller.rating +
            (rating || 0)
          ) / 2;

        // bogus product found
        if (status === 'bogus') {

          existingSeller.reports += 1;

          existingSeller.status =
            'flagged';

          existingSeller.reason =
            'Suspicious products detected';
        }

        await existingSeller.save();
      }
    }

    // ========================================
    // CREATE PRODUCT
    // ========================================

    const product =
      await Product.create({

        name,

        price,

        originalPrice: price,

        image: image || '',

        category:
          category || 'Others',

        platform:
          platform || 'Unknown',

        rating:
          rating || 0,

        reviews:
          reviews || 0,

        status,

        inStock: true,

        url: url || '',

        sellerName:
          sellerName || '',

        sellerId:
          sellerId || ''
      });

    res.status(201).json({
      success: true,
      message: 'Product saved',
      product
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// UPDATE PRODUCT
// PUT /api/products/:id
// ========================================

router.put('/:id', async (req, res) => {
  try {

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true
        }
      );

    if (!product) {

      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated',
      product
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// DELETE PRODUCT
// DELETE /api/products/:id
// ========================================

router.delete('/:id', async (req, res) => {
  try {

    const product =
      await Product.findByIdAndDelete(
        req.params.id
      );

    if (!product) {

      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted',
      id: req.params.id
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// VERIFY PRODUCT
// PUT /api/products/:id/verify
// ========================================

router.put('/:id/verify', async (req, res) => {
  try {

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        {
          status: 'verified'
        },
        {
          new: true
        }
      );

    if (!product) {

      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product verified',
      product
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

// ========================================
// FLAG PRODUCT AS BOGUS
// PUT /api/products/:id/bogus
// ========================================

router.put('/:id/bogus', async (req, res) => {
  try {

    const product =
      await Product.findByIdAndUpdate(
        req.params.id,
        {
          status: 'bogus'
        },
        {
          new: true
        }
      );

    if (!product) {

      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product flagged as bogus',
      product
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });
  }
});

export default router;