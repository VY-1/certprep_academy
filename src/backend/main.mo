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

  // Explicit admin entrypoints (fallback) in case mixin-exported update methods
  // are not visible on the deployed canister for any reason. These directly
  // call the library upsert helpers and will accept the same candid types.
  public func adminUpsertQuestions(qs : [Types.Question]) : async () {
    for (q in qs.values()) { ExamsLib.upsertQuestion(questions, q) };
  };

  public func adminUpsertExplanations(expls : [Types.QuestionExplanation]) : async () {
    for (ex in expls.values()) { ExamsLib.upsertExplanation(explanations, ex) };
  };

  public func adminUpsertExams(exs : [Types.CertificationExam]) : async () {
    for (ex in exs.values()) { ExamsLib.upsertExam(exams, ex) };
  };
};
