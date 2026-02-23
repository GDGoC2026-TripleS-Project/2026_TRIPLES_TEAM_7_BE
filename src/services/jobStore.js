// jobStore.js - 간단한 메모리 저장소 (서버 재시작 시 초기화됨)
const jobs = new Map();

exports.createJob = (jobId) => {
    jobs.set(jobId, { status: 'PENDING', result: null, error: null, createdAt: Date.now() });
};

exports.updateJob = (jobId, data) => {
    const job = jobs.get(jobId);
    if (job) jobs.set(jobId, { ...job, ...data });
};

exports.getJob = (jobId) => jobs.get(jobId);

// 1시간 지난 job 자동 삭제
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobs.entries()) {
        if (now - job.createdAt > 60 * 60 * 1000) jobs.delete(id);
    }
}, 10 * 60 * 1000);