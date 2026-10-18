/**
 * Wiki sections this site does not convert, each with the reason. A section that is neither converted nor listed
 * here makes `tools/wiki/run.ts` stop, so nothing is dropped by accident.
 */
const SECOND_BATCH = "第二批（使用者決定先不做）";
const UNDECIDED = "尚未決定，需問使用者";
const NOT_GUIDE = "不是攻略內容";

export const EXCLUDED: Record<string, string> = {
  // agreed: second batch
  "people/factions": SECOND_BATCH,
  "people/mobs": SECOND_BATCH,
  "people/title-list": SECOND_BATCH,
  "system/facility": SECOND_BATCH,
  "system/training": SECOND_BATCH,

  // not discussed with the user yet
  "event/pre-game-timeline": UNDECIDED,
  "event/stories": UNDECIDED,
  "event/story-branch-timeline": UNDECIDED,
  "event/story-simple-table": UNDECIDED,
  "other/dali-duan-lineage": UNDECIDED,
  "other/qna": UNDECIDED,
  "system/engagement": UNDECIDED,
  "system/hidden-params": UNDECIDED,

  // not guide content
  index: NOT_GUIDE,
  "wiki-list": NOT_GUIDE,
  "other/news": "官方更新公告，不是攻略內容",
  "other/test": "wiki 的測試頁",
  "other/image-generator": "wiki 的圖片產生器工具",
  "other/lom-sheet": "外部試算表的連結頁",
  "system/soundtrack": "原聲帶，不是攻略內容",
};
