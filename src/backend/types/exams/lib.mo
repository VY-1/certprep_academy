import Debug "mo:core/Debug";

module {
  /// Variant for PTCB knowledge domains — extensible for other certifications.
  public type KnowledgeDomain = {
    #Medications;
    #FederalRequirements;
    #PatientSafety;
    #OrderEntry;
    #Other : Text;
  };

  /// A certification exam program (e.g., PTCB, NCLEX).
  public type CertificationExam = {
    id : Text;
    name : Text;
    description : Text;
  };

  /// A specific versioned practice test for a certification.
  public type ExamVersion = {
    id : Text;
    examId : Text;
    versionName : Text;
    totalQuestions : Nat;
    scoredQuestions : Nat;
    timeLimitMinutes : Nat;
  };

  /// A single question within an exam version.
  public type Question = {
    id : Text;
    versionId : Text;
    text : Text;
    options : [Text];        // exactly 4 options
    correctOptionIndex : Nat; // 0-3
    explanation : Text;
    knowledgeDomain : KnowledgeDomain;
    isScored : Bool;
  };

  /// Persisted overlay for explanations imported from external seeds.
  public type QuestionExplanation = {
    id : Text;
    explanation : Text;
  };
};
