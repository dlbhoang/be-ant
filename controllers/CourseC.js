const Course = require('../models/Course');
const Category = require('../models/Category');
const User = require('../models/User');
const cloudUploader = require('../utils/cloudUploader');
const clgDev = require('../utils/clgDev');
const ErrorResponse = require('../utils/ErrorResponse');
const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const CourseProgress = require('../models/CourseProgress');

exports.getAllPublishedCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'Published' }).populate('instructor').populate('category').exec();

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp tất cả khóa học đã xuất bản', 500));
  }
};


exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate({
        path: 'instructor',
        populate: {
          path: 'profile',
        },
      })
      .populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections',
          select: '-videoUrl',
        },
      })
      .exec();

    if (!course || course.status === 'Draft') {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    console.log(err);
    next(new ErrorResponse('Không thể tìm nạp khóa học', 500));
  }
};

exports.getFullCourseDetails = async (req, res, next) => {
  try {
    const instructorId = req.user.id;

    const { courseId } = req.body;

    if (!courseId) {
      return next(new Error('Yêu cầu không hợp lệ', 404));
    }

    const course = await Course.findById(courseId)
      .populate({
        path: 'instructor',
        populate: {
          path: 'profile',
        },
      })
      .populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections',
        },
      })
      .exec();

    if (!course) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    if (course.instructor._id.toString() !== instructorId) {
      return next(new ErrorResponse('Truy cập trái phép', 401));
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    console.log(err);
    next(new ErrorResponse('Không thể tìm nạp khóa học', 500));
  }
};



exports.createCourse = async (req, res, next) => {
  try {
    const instructorId = req.user.id;
    const { title, description, whatYouWillLearn, price, category } = req.body;
    const tags = req.body?.tags ? JSON.parse(req.body?.tags) : null;
    const instructions = req.body?.instructions ? JSON.parse(req.body?.instructions) : null;
    const thumbnail = req.files?.thumbnail;

    if (!(instructorId && title && description && whatYouWillLearn && price && category && tags && instructions && thumbnail)) {
      return next(new ErrorResponse('Tất cả các trường là bắt buộc', 404));
    }

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return next(new ErrorResponse('Không tìm thấy danh mục như vậy', 404));
    }

    if (thumbnail.size > process.env.THUMBNAIL_MAX_SIZE) {
      return next(new ErrorResponse(`Vui lòng tải lên một hình ảnh nhỏ hơn ${process.env.THUMBNAIL_MAX_SIZE / 1024} KB`, 400));
    }

    if (!thumbnail.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Vui lòng tải lên một tập tin hình ảnh', 400));
    }

    const allowedFileType = ['jpeg', 'jpg', 'png'];
    const thumbnailType = thumbnail.mimetype.split('/')[1];

    if (!allowedFileType.includes(thumbnailType)) {
      return next(new ErrorResponse('Vui lòng tải lên tệp hình ảnh hợp lệ', 400));
    }

    thumbnail.name = `thumbnail_${instructorId}_${Date.now()}`;
    const image = await cloudUploader(thumbnail, process.env.THUMBNAIL_FOLDER_NAME, 200, 80);

    // create course
    const courseDetails = await Course.create({
      title,
      description,
      instructor: instructorId,
      whatYouWillLearn,
      price,
      category,
      instructions,
      thumbnail: image.secure_url,
      tags,
    });
    await User.findByIdAndUpdate(
      instructorId,
      {
        $push: { courses: courseDetails._id },
      },
      { new: true }
    );

    await Category.findByIdAndUpdate(
      categoryDetails._id,
      {
        $push: { courses: courseDetails._id },
      },
      { new: true }
    );

    const courseFullDetails = await Course.findById(courseDetails._id)
      .populate({
        path: 'instructor',
        populate: {
          path: 'profile',
        },
      })
      .populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections',
        },
      })
      .exec();

    res.status(201).json({
      success: true,
      data: courseFullDetails,
    });
  } catch (err) {
    next(new ErrorResponse('Không tạo được khóa học', 500));
  }
};

exports.editCourse = async (req, res, next) => {
  try {
    const instructorId = req.user.id;

    const { courseId } = req.body;
    const updates = req.body;
    const thumbnail = req.files?.thumbnail;

    if (updates.hasOwnProperty('thumbnail') && !thumbnail) {
      return next(new Error('Vui lòng chọn hình thu nhỏ', 404));
    }

    if (!courseId) {
      return next(new Error('Yêu cầu không hợp lệ', 404));
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    if (course.instructor._id.toString() !== instructorId) {
      return next(new ErrorResponse('Truy cập trái phép', 401));
    }

    if (thumbnail) {
      if (thumbnail.size > process.env.THUMBNAIL_MAX_SIZE) {
        return next(new ErrorResponse(`Vui lòng tải lên một hình ảnh nhỏ hơn ${process.env.THUMBNAIL_MAX_SIZE / 1024} KB`, 400));
      }

      if (!thumbnail.mimetype.startsWith('image')) {
        return next(new ErrorResponse('Vui lòng tải lên một tập tin hình ảnh', 400));
      }

      const allowedFileType = ['jpeg', 'jpg'];
      const thumbnailType = thumbnail.mimetype.split('/')[1];

      if (!allowedFileType.includes(thumbnailType)) {
        return next(new ErrorResponse('Vui lòng tải lên tệp hình ảnh hợp lệ', 400));
      }

      thumbnail.name = `thumbnail_${instructorId}_${Date.now()}`;
      const image = await cloudUploader(thumbnail, process.env.THUMBNAIL_FOLDER_NAME, 200, 80);
      course.thumbnail = image.secure_url;
    }

    if (updates.tags) updates.tags = JSON.parse(updates.tags);
    if (updates.instructions) updates.instructions = JSON.parse(updates.instructions);

    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        course[key] = updates[key];
      }
    }

    await course.save();

    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: 'instructor',
        populate: {
          path: 'profile',
        },
      })
      .populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections',
        },
      })
      .exec();

    return res.status(200).json({
      success: true,
      data: updatedCourse,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể chỉnh sửa khóa học', 500));
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const instructorId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      return next(new Error('Yêu cầu không hợp lệ', 404));
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    if (course.instructor._id.toString() !== instructorId) {
      return next(new ErrorResponse('Truy cập trái phép', 401));
    }

    if (course.studentsEnrolled.length !== 0) {
      return next(new ErrorResponse("Không thể xóa khóa học, một số sinh viên đã đăng ký", 404));
    }

    const courseSections = course.sections;
    for (const sectionId of courseSections) {
      const section = await Section.findById(sectionId);
      const subSections = section.subSections;

      for (const subSectionId of subSections) {
        await SubSection.findByIdAndDelete(subSectionId);
      }

      await Section.findByIdAndDelete(sectionId);
    }

    await Course.findByIdAndDelete(courseId);

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể xóa khóa học', 500));
  }
};

exports.getEnrolledCourseData = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    if (!courseId) {
      return next(new Error('Yêu cầu không hợp lệ', 404));
    }

    const course = await Course.findOne({
      _id: courseId,
      status: 'Published',
    })
      .populate({
        path: 'instructor',
        populate: {
          path: 'profile',
        },
      })
      .populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections',
        },
      })
      .exec();

    if (!course) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    if (!course.studentsEnrolled.includes(userId)) {
      return next(new ErrorResponse('Sinh viên không được ghi danh vào các khóa học', 401));
    }

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!courseProgress) {
      return next(new ErrorResponse('Không tìm thấy tiến trình khóa học như vậy', 404));
    }

    let totalNoOfVideos = 0;
    for (let section of course.sections) {
      totalNoOfVideos += section.subSections.length;
    }

    return res.status(200).json({
      success: true,
      data: {
        course,
        completedVideos: courseProgress.completedVideos,
        totalNoOfVideos,
      },
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp dữ liệu khóa học đã đăng ký', 500));
  }
};
