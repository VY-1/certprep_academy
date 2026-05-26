module {
  type OldActor = {
    var seeded : Bool;
    var enriched : Bool;
  };

  type NewActor = {};

  // Drops seeded and enriched flags — no longer needed because seed functions
  // are called unconditionally on every init and are idempotent.
  public func run(_old : OldActor) : NewActor { {} };
};
