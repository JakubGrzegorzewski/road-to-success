import {RankInProgress, Style} from "@/scripts/objectTemplates";

function doShowIdea (rankInProgress : RankInProgress) : boolean {
    return [Style.IDEA_SELECTION, Style.MULTI_TASK_ONE_REQUIREMENT_WITH_IDEA, Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA, Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA].indexOf(rankInProgress.style) !== -1;
}

function doShowDeleteTaskButton (rankInProgress : RankInProgress) : boolean {
    return [Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA, Style.ONE_TASK_ONE_REQUIREMENT].indexOf(rankInProgress.style) === -1;
}
function doShowAddTaskButton (rankInProgress : RankInProgress) : boolean {
    return [Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA, Style.ONE_TASK_ONE_REQUIREMENT].indexOf(rankInProgress.style) === -1;
}
export {doShowIdea, doShowDeleteTaskButton, doShowAddTaskButton}