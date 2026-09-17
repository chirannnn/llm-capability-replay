-- CreateTable
CREATE TABLE "capabilities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "tenant_id" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "target" JSONB NOT NULL,
    "inputs" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "outputs" JSONB NOT NULL,
    "safety" JSONB NOT NULL,
    "versionMetadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "capability_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "status" TEXT NOT NULL,
    "inputValues" JSONB NOT NULL,
    "outputValues" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_steps" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "actionTaken" JSONB,
    "result" JSONB,
    "errorType" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "evidencePath" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "run_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "human_handoffs" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "step_id" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "instructions" TEXT,
    "handedOffAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumedAt" TIMESTAMP(3),
    "completedBy" TEXT,

    CONSTRAINT "human_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "capabilities_tenant_id_idx" ON "capabilities"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "capabilities_name_version_tenant_id_key" ON "capabilities"("name", "version", "tenant_id");

-- CreateIndex
CREATE INDEX "automation_runs_capability_id_idx" ON "automation_runs"("capability_id");

-- CreateIndex
CREATE INDEX "automation_runs_tenant_id_idx" ON "automation_runs"("tenant_id");

-- CreateIndex
CREATE INDEX "run_steps_run_id_idx" ON "run_steps"("run_id");

-- CreateIndex
CREATE INDEX "human_handoffs_run_id_idx" ON "human_handoffs"("run_id");

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "capabilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "automation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "human_handoffs" ADD CONSTRAINT "human_handoffs_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "automation_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
