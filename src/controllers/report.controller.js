const {
  createReport,
  getReports,
  getReportById,
  resolveReport,
} = require("../services/report.service");

const createReportHandler = async (req, res, next) => {
  try {
    const reporterId = req.user.id;
    const { postId, commentId, reportedUserId, reason, description } = req.body;

    const result = await createReport({
      reporterId,
      postId,
      commentId,
      reportedUserId,
      reason,
      description,
    });

    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const getReportsHandler = async (req, res, next) => {
  try {
    const result = await getReports();

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const getReportByIdHandler = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const result = await getReportById({ reportId });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

const resolveReportHandler = async (req, res, next) => {
  try {
    const resolverId = req.user.id;
    const { reportId } = req.params;
    const { status } = req.body;

    const result = await resolveReport({
      resolverId,
      reportId,
      status,
    });

    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReportHandler,
  getReportsHandler,
  getReportByIdHandler,
  resolveReportHandler,
};
