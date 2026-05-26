import Types "types/exams";
import ExamsMixin "mixins/exams-api";
import List "mo:core/List";
import ExamsLib "lib/exams";

persistent actor {
  let exams     = List.empty<Types.CertificationExam>();
  let versions  = List.empty<Types.ExamVersion>();
  let questions = List.empty<Types.Question>();
  let explanations = List.empty<Types.QuestionExplanation>();
  // Always seed unconditionally on every actor init.
  // Both functions are idempotent (use addExamIfMissing / addVersionIfMissing /
  // addQuestionIfMissing) so repeated calls on upgrade produce no duplicates.
  // This is required because Bool flags reset to false on every upgrade with
  // enhanced orthogonal persistence.
  ExamsLib.seedPtcbData(exams, versions, questions);
  ExamsLib.ensureAdditionalVersions(versions, questions, explanations);

  include ExamsMixin(exams, versions, questions, explanations);
};
