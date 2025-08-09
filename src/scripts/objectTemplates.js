const AppUserDto =
{
    "id": null,
    "fullName": "",
    "email": "",
    "password": "",
    "role": "",
    "ranksInProgressIds": [],
    "commentIds": []
}

const CommentDto =
{
    "id": null,
    "userId": null,
    "date": null,
    "content": "",
    "taskId": null
}

const RankDto =
{
    "id": null,
    "fullName": "",
    "shortName": "",
    "idea": "",
    "startRequirements": [],
    "endRequirements": [],
    "requirementIds": [],
    "ranksInProgressIds": []
}

const RankInProgressDto =
{
    "id": null,
    "rankId": null,
    "userId": null,
    "status": "",
    "taskIds": []
}


const RequirementDto =
{
    "id": null,
    "number": "",
    "content": "",
    "rankId": null,
    "taskIds": []
}

const TaskDto =
{
    "id": null,
    "rankInProgressId": null,
    "requirementId": null,
    "content": "",
    "status": "",
    "partIdea": "",
    "commentIds": []
}

export default {
    AppUserDto,
    CommentDto,
    RankDto,
    RankInProgressDto,
    RequirementDto,
    TaskDto
}