const SubSection = require('../models/SubSection');
const Section = require('../models/Section');
const ErrorResponse = require('../utils/ErrorResponse');
const clgDev = require('../utils/clgDev');
const cloudUploader = require('../utils/cloudUploader');
const Course = require('../models/Course');

exports.createSubSection = async (req, res, next) => {
  try {
    const { title, timeDuration, description, sectionId } = req.body;
    const userId = req.user.id;
    const video = req?.files?.video;

    if (!(title && timeDuration && sectionId && video)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }


    let sectionDetails = await Section.findById(sectionId);
    if (!sectionDetails) {
      return next(new ErrorResponse('Không tìm thấy phần như vậy', 404));
    }

    if (sectionDetails.user.toString() !== userId) {
      return next(new ErrorResponse('Người dùng không được ủy quyền', 401));
    }

    if (video.size > process.env.VIDEO_MAX_SIZE) {
      return next(new ErrorResponse(`Vui lòng tải lên một video ít hơn ${process.env.VIDEO_MAX_SIZE / (1024 * 1024)} MB`, 400));
    }

    if (!video.mimetype.startsWith('video')) {
      return next(new ErrorResponse('Vui lòng tải lên một tập tin video', 400));
    }

    const allowedFileType = ['mp4', 'mkv'];
    const videoType = video.mimetype.split('/')[1];

    if (!allowedFileType.includes(videoType)) {
      return next(new ErrorResponse('Vui lòng tải lên tệp hình ảnh hợp lệ', 400));
    }

    video.name = `vid_${req.user.id}_${Date.now()}.${videoType}`;
    const videoDetails = await cloudUploader(video, process.env.VIDEO_FOLDER_NAME, undefined, 75);


    const subSection = await SubSection.create({
      title,
      timeDuration,
      description,
      section: sectionId,
      user: userId,
      videoUrl: videoDetails.secure_url,
    });

    sectionDetails = await Section.findByIdAndUpdate(
      sectionId,
      {
        $push: { subSections: subSection._id },
      },
      { new: true }
    );

    const updatedCourse = await Course.findByIdAndUpdate(
      sectionDetails.course,
      { $inc: { totalDuration: timeDuration } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: subSection,
    });
  } catch (err) {
    next(new ErrorResponse('Không tạo được phần phụ. Vui lòng thử lại', 500));
  }
};

exports.updateSubSection = async (req, res, next) => {
  try {
    const subSectionId = req.body.subSectionId;

    if (!subSectionId) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return next(new ErrorResponse('Không tìm thấy tiểu mục như vậy', 404));
    }

    if (subSection.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Người dùng không được phép thực hiện tác vụ này', 404));
    }

    const { title, timeDuration, description } = req.body;
    let videoUrl = null;

    if (req.files && req.files.video) {
      const video = req.files.video;
      if (video.size > process.env.VIDEO_MAX_SIZE) {
        return next(new ErrorResponse(`Vui lòng tải lên một video ít hơn ${process.env.VIDEO_MAX_SIZE / (1024 * 1024)} MB`, 400));
      }

      if (!video.mimetype.startsWith('video')) {
        return next(new ErrorResponse('Vui lòng tải lên một tập tin video', 400));
      }

      const allowedFileType = ['mp4', 'mkv'];
      const videoType = video.mimetype.split('/')[1];

      if (!allowedFileType.includes(videoType)) {
        return next(new ErrorResponse('Vui lòng tải lên tệp hình ảnh hợp lệ', 400));
      }

      video.name = `vid_${req.user.id}_${Date.now()}.${videoType}`;
      const videoDetails = await cloudUploader(video, process.env.VIDEO_FOLDER_NAME, undefined, 75);
      videoUrl = videoDetails.secure_url;
    }

    const updatedSubSection = await SubSection.findByIdAndUpdate(
      subSection._id,
      {
        title,
        timeDuration,
        description,
        videoUrl
      },
      { new: true }
    );

    const updatedSection = await Section.findById(subSection.section).populate("subSections");

    if (timeDuration) {
      const updatedCourse = await Course.findByIdAndUpdate(
        updatedSection.course,
        { $inc: { totalDuration: timeDuration - subSection.timeDuration } },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      data: updatedSection,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể cập nhật phần phụ', 500));
  }
};


exports.deleteSubSection = async (req, res, next) => {
  try {
    const subSectionId = req.body.subSectionId;
    const instructorId = req.user.id;

    if (!subSectionId) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    const subSection = await SubSection.findById(subSectionId);

    if (!subSection) {
      return next(new ErrorResponse('Không tìm thấy tiểu mục như vậy', 404));
    }

    if (subSection.user.toString() !== instructorId) {
      return next(new ErrorResponse('Người dùng không được phép thực hiện tác vụ này', 404));
    }

    // update section
    const updatedSection = await Section.findByIdAndUpdate(
      subSection.section,
      {
        $pull: { subSections: subSection._id },
      },
      { new: true }
    ).populate("subSections");


    const updatedCourse = await Course.findByIdAndUpdate(
      updatedSection.course,
      { $inc: { totalDuration: -subSection.timeDuration } },
      { new: true }
    );

    subSection.deleteOne();

    res.status(200).json({
      success: true,
      data: updatedSection,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể xóa phần phụ. Vui lòng thử lại', 500));
  }
};
