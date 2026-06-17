import Types "../types/exams";
import ExamsLib "../lib/exams";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

mixin (
  exams    : List.List<Types.CertificationExam>,
  versions : List.List<Types.ExamVersion>,
  questions : List.List<Types.Question>,
  explanations : List.List<Types.QuestionExplanation>,
  profiles : List.List<Types.UserProfile>,
  attempts : List.List<{ principal : Principal; attempt : Types.SyncedAttempt; createdAt : Int; updatedAt : Int }>
) {
  func requireAuthenticated(me : Principal) {
    if (me.isAnonymous()) {
      Runtime.trap("Please sign in to sync progress or edit your profile.");
    };
  };

  func normalizeProfileField(value : ?Text) : ?Text {
    switch (value) {
      case (?raw) {
        if (raw == "") { null } else { ?raw };
      };
      case null { null };
    };
  };

  func upsertProfile(me : Principal, patch : Types.UserProfilePatch) : Types.UserProfile {
    let now = Time.now();
    switch (profiles.find(func(p) { p.principal == me })) {
      case (?existing) {
        let updated : Types.UserProfile = {
          principal = me;
          username = normalizeProfileField(patch.username);
          fullName = normalizeProfileField(patch.fullName);
          email = normalizeProfileField(patch.email);
          createdAt = existing.createdAt;
          updatedAt = now;
        };
        var i : Nat = 0;
        let n : Nat = profiles.size();
        var replaced : Bool = false;
        while (i < n) {
          let profile = profiles.at(i);
          if (profile.principal == me) {
            profiles.put(i, updated);
            replaced := true;
            break;
          };
          i += 1;
        };
        if (not replaced) { profiles.add(updated) };
        updated;
      };
      case null {
        let created : Types.UserProfile = {
          principal = me;
          username = normalizeProfileField(patch.username);
          fullName = normalizeProfileField(patch.fullName);
          email = normalizeProfileField(patch.email);
          createdAt = now;
          updatedAt = now;
        };
        profiles.add(created);
        created;
      };
    };
  };

  func upsertAttempt(me : Principal, result : Types.SyncedAttempt) : () {
    let now = Time.now();
    var i : Nat = 0;
    let n : Nat = attempts.size();
    var replaced : Bool = false;
    while (i < n) {
      let item = attempts.at(i);
      if (item.principal == me and item.attempt.id == result.id) {
        attempts.put(i, { principal = me; attempt = result; createdAt = item.createdAt; updatedAt = now });
        replaced := true;
        break;
      };
      i += 1;
    };
    if (not replaced) {
      attempts.add({ principal = me; attempt = result; createdAt = now; updatedAt = now });
    };
  };

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

  /// Admin: upsert multiple persisted explanations (overwrite existing overlays).
  public func upsertExplanations(expls : [Types.QuestionExplanation]) : async () {
    for (ex in expls.values()) { ExamsLib.upsertExplanation(explanations, ex) };
  };

  /// Admin: upsert multiple questions (overwrite existing question entries).
  public func upsertQuestions(qs : [Types.Question]) : async () {
    for (q in qs.values()) { ExamsLib.upsertQuestion(questions, q) };
  };

  /// Return the current caller principal.
  public shared(msg) func whoami() : async Principal {
    msg.caller;
  };

  /// Return the signed-in caller profile, if present.
  public shared(msg) func getMyProfile() : async ?Types.UserProfile {
    let me = msg.caller;
    if (me.isAnonymous()) {
      return null;
    };
    switch (profiles.find(func(p) { p.principal == me })) {
      case (?profile) { ?profile };
      case null { null };
    };
  };

  /// Create or update the signed-in caller profile.
  public shared(msg) func updateMyProfile(patch : Types.UserProfilePatch) : async Types.UserProfile {
    requireAuthenticated(msg.caller);
    upsertProfile(msg.caller, patch);
  };

  /// Save or replace one synced study-history entry for the signed-in caller.
  public shared(msg) func saveMyResult(result : Types.SyncedAttempt) : async () {
    requireAuthenticated(msg.caller);
    upsertAttempt(msg.caller, result);
  };

  /// Save or replace a batch of synced study-history entries.
  public shared(msg) func saveMyResultsBatch(results : [Types.SyncedAttempt]) : async () {
    requireAuthenticated(msg.caller);
    for (result in results.values()) {
      upsertAttempt(msg.caller, result);
    };
  };

  /// Return synced study-history entries for the signed-in caller.
  public shared(msg) func getMyResults() : async [Types.SyncedAttempt] {
    let me = msg.caller;
    if (me.isAnonymous()) {
      return [];
    };
    attempts
      .filter(func(item) { item.principal == me })
      .map<{ principal : Principal; attempt : Types.SyncedAttempt; createdAt : Int; updatedAt : Int }, Types.SyncedAttempt>(func(item) { item.attempt })
      .toArray();
  };
};
