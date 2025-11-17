import {Style} from "@/scripts/Model/Style.js";

function doShowIdea (style : Style) : boolean {
    return [Style.IDEA_SELECTION,
        Style.MULTI_TASK_ONE_REQUIREMENT_WITH_IDEA,
        Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
        Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA]
        .indexOf(style) !== -1;
}

function doShowDeleteTaskButton (style : Style) : boolean {
    return [Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA,
        Style.ONE_TASK_ONE_REQUIREMENT]
        .indexOf(style) === -1;
}

function doShowAddTaskButton (style : Style) : boolean {
    return [Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA,
        Style.ONE_TASK_ONE_REQUIREMENT
    ].indexOf(style) === -1;
}

function isRequirementBased(style : Style) : boolean{
    return [Style.ONE_TASK_ONE_REQUIREMENT,
        Style.ONE_TASK_ONE_REQUIREMENTS_WITH_IDEA,
        Style.MULTI_TASK_ONE_REQUIREMENT,
        Style.MULTI_TASK_ONE_REQUIREMENT_WITH_IDEA,
    ].indexOf(style) !== -1
}

function isIdeaBased(style : Style) : boolean{
    return [Style.IDEA_SELECTION,
        Style.ONE_TASK_MULTI_REQUIREMENTS_WITH_IDEA,
        Style.ONE_TASK_MULTI_REQUIREMENTS
    ].indexOf(style) !== -1
}

export {doShowIdea, doShowDeleteTaskButton, doShowAddTaskButton, isRequirementBased, isIdeaBased}