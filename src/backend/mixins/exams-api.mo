import Types "../types/exams";
import ExamsLib "../lib/exams";
import List "mo:core/List";

mixin (
  exams    : List.List<Types.CertificationExam>,
  versions : List.List<Types.ExamVersion>,
  questions : List.List<Types.Question>,
  explanations : List.List<Types.QuestionExplanation>
) {
  /// Return all available certification exams.
  public query func getExams() : async [Types.CertificationExam] {
    ExamsLib.listExams(exams);
  };

  /// Return metadata for one certification exam by id.
  public query func getExamDetails(examId : Text) : async ?Types.CertificationExam {
    ExamsLib.getExam(exams, examId);
  };

  /// Return all versions for a given exam id.
  public query func getExamVersions(examId : Text) : async [Types.ExamVersion] {
    ExamsLib.listVersionsForExam(versions, examId);
  };

  /// Return all questions (with correct answers) for a given version id.
  public query func getExamQuestions(versionId : Text) : async [Types.Question] {
    ExamsLib.listQuestionsForVersion(questions, explanations, versionId);
  };

  /// Add a new certification exam (admin operation).
  public func addExam(exam : Types.CertificationExam) : async () {
    ExamsLib.addExam(exams, exam);
  };
};
