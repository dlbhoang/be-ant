const Category = require('../models/Category');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/ErrorResponse');
const clgDev = require('../utils/clgDev');

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}, { name: true, description: true });
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp tất cả các danh mục', 500));
  }
};


exports.getAllCategoryCourses = async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    let requestedCategory = null;
    let requestedCategoryCoursesMost = null;
    let requestedCategoryCoursesNew = null;

    if (categoryId) {
      const reqCat = await Category.findById(categoryId)
        .populate({
          path: 'courses',
          match: { status: 'Published' },
          populate: {
            path: 'instructor',
          },
        })
        .exec();

      requestedCategory = {
        name: reqCat.name,
        description: reqCat.description,
        _id: reqCat._id,
      };

      if (reqCat.courses.length) {
        requestedCategoryCoursesMost = reqCat.courses.sort((a, b) => b.numberOfEnrolledStudents - a.numberOfEnrolledStudents);

        requestedCategoryCoursesNew = reqCat.courses.sort((a, b) => b.createdAt - a.createdAt);
      }
    }

    const categoriesExceptRequested = await Category.find({ _id: { $ne: categoryId } });

    const otherCategoryCourses = await Category.findById(categoriesExceptRequested[getRandomInt(categoriesExceptRequested.length)]._id).populate({
      path: 'courses',
      match: { status: 'Published' },
      populate: {
        path: 'instructor',
      },
    });

    const topSellingCourses = await Course.find({
      status: 'Published',
    })
      .sort({
        numberOfEnrolledStudents: 'desc',
      })
      .populate({
        path: 'category',
        match: { status: 'Published' },
        select: 'name',
      })
      .populate('instructor')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        requestedCategory,
        requestedCategoryCoursesMost,
        requestedCategoryCoursesNew,
        otherCategoryCourses,
        topSellingCourses,
      },
    });
  } catch (err) {
    console.log(err);
    next(new ErrorResponse('Không thể tìm nạp tất cả các khóa học thuộc danh mục. Vui lòng thử lại', 500));
  }
};


exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(new ErrorResponse('Vui lòng thêm tên danh mục', 400));
    }

    const category = await Category.create({ name, description });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(new ErrorResponse('Không tạo được danh mục', 500));
  }
};

const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
};
