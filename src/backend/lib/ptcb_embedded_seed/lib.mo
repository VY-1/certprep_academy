import Types "../types/exams";
import List "mo:core/List";
import EmbeddedPayload "../ptcb_embedded_payload";

module {
  public func embeddedPtcbQuestions() : [Types.Question] {
    return EmbeddedPayload.embeddedPtcbPayload();
  };
}
