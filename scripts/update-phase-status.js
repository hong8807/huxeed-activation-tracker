#!/usr/bin/env node

/**
 * Phase 상태 자동 업데이트 스크립트
 *
 * 사용법:
 *   node scripts/update-phase-status.js <phase-number> <task-index> [--complete]
 *
 * 예시:
 *   node scripts/update-phase-status.js 3 1 --complete  # Phase 3의 1번 작업 완료
 *   node scripts/update-phase-status.js 3 summary        # Phase 3 요약 보기
 */

const fs = require('fs');
const path = require('path');

// CLAUDE.md 경로
const CLAUDE_MD_PATH = path.join(__dirname, '../../CLAUDE.md');
const PROJECT_STATUS_PATH = path.join(__dirname, '../PROJECT_STATUS.md');

// Phase 정의
const PHASES = {
  1: 'Phase 1: 데이터베이스 & 타입 정의',
  2: 'Phase 2: 시스템 내 입력 기능',
  3: 'Phase 3: 소싱 관리 기능',
  4: 'Phase 4: Dashboard KPI',
  5: 'Phase 5: Report 페이지',
  6: 'Phase 6: 12단계 지원',
  7: 'Phase 7: 세그먼트 관리',
  8: 'Phase 8: Pipeline 삭제 기능',
  9: 'Phase 9: 절감율 표시 오류 수정',
};

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf-8');
}

function getPhaseProgress(content, phaseNumber) {
  const phasePattern = new RegExp(
    `\\*\\*Phase ${phaseNumber}:.*?\\*\\*([\\s\\S]*?)(?=\\*\\*Phase|---)`
  );
  const match = content.match(phasePattern);

  if (!match) {
    console.error(`❌ Phase ${phaseNumber}을 찾을 수 없습니다.`);
    return null;
  }

  const phaseContent = match[1];
  const totalTasks = (phaseContent.match(/- \[[ x]\]/g) || []).length;
  const completedTasks = (phaseContent.match(/- \[x\]/g) || []).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    content: phaseContent,
    totalTasks,
    completedTasks,
    progress,
    isComplete: progress === 100,
  };
}

function showPhaseSummary(phaseNumber) {
  console.log(`\n📊 Phase ${phaseNumber} 현황\n`);

  const content = readFile(CLAUDE_MD_PATH);
  const progress = getPhaseProgress(content, phaseNumber);

  if (!progress) return;

  console.log(`📋 ${PHASES[phaseNumber]}`);
  console.log(`진행률: ${progress.completedTasks}/${progress.totalTasks} (${progress.progress}%)`);
  console.log(`상태: ${progress.isComplete ? '✅ 완료' : '🔄 진행중'}\n`);

  // 작업 목록 출력
  const tasks = progress.content.match(/- \[[ x]\] .+/g) || [];
  tasks.forEach((task, index) => {
    const isComplete = task.includes('[x]');
    const taskText = task.replace(/- \[[ x]\] /, '');
    console.log(`${index + 1}. ${isComplete ? '✅' : '⏳'} ${taskText}`);
  });
}

function updatePhaseTask(phaseNumber, taskIndex, complete = true) {
  const content = readFile(CLAUDE_MD_PATH);
  const phasePattern = new RegExp(
    `(\\*\\*Phase ${phaseNumber}:.*?\\*\\*)([\\s\\S]*?)(?=\\*\\*Phase|---)`
  );

  const match = content.match(phasePattern);
  if (!match) {
    console.error(`❌ Phase ${phaseNumber}을 찾을 수 없습니다.`);
    return;
  }

  const phaseHeader = match[1];
  let phaseContent = match[2];
  const tasks = phaseContent.match(/- \[[ x]\] .+/g) || [];

  if (taskIndex < 1 || taskIndex > tasks.length) {
    console.error(`❌ 잘못된 작업 번호입니다. (1-${tasks.length})`);
    return;
  }

  // 작업 상태 변경
  const oldTask = tasks[taskIndex - 1];
  const newTask = complete
    ? oldTask.replace('[ ]', '[x]')
    : oldTask.replace('[x]', '[ ]');

  phaseContent = phaseContent.replace(oldTask, newTask);

  // Phase 제목에 완료 표시 추가/제거
  const updatedContent = content.replace(phasePattern, (match, header, body) => {
    return header + phaseContent;
  });

  // 진행률 확인
  const progress = getPhaseProgress(updatedContent, phaseNumber);

  // Phase 완료 상태 업데이트
  let finalContent = updatedContent;
  if (progress.isComplete) {
    finalContent = finalContent.replace(
      new RegExp(`\\*\\*Phase ${phaseNumber}:([^*]+)\\*\\*`),
      `**Phase ${phaseNumber}:$1** ✅`
    );
  } else {
    finalContent = finalContent.replace(
      new RegExp(`\\*\\*Phase ${phaseNumber}:([^*]+)\\*\\* (✅|🔄 \\(진행중\\))`),
      `**Phase ${phaseNumber}:$1** 🔄 (진행중)`
    );
  }

  writeFile(CLAUDE_MD_PATH, finalContent);

  console.log('\n✅ CLAUDE.md가 업데이트되었습니다.\n');
  console.log(`Phase ${phaseNumber} - 작업 ${taskIndex}: ${complete ? '완료' : '미완료'} 처리`);
  console.log(`진행률: ${progress.completedTasks}/${progress.totalTasks} (${progress.progress}%)`);

  if (progress.isComplete) {
    console.log('\n🎉 Phase 완료! PROJECT_STATUS.md도 업데이트하세요.');
  }
}

function showHelp() {
  console.log(`
📘 Phase 상태 업데이트 스크립트

사용법:
  node scripts/update-phase-status.js <phase-number> <task-index> [--complete]
  node scripts/update-phase-status.js <phase-number> summary

예시:
  node scripts/update-phase-status.js 3 1 --complete  # Phase 3의 1번 작업 완료
  node scripts/update-phase-status.js 3 1              # Phase 3의 1번 작업 미완료로 변경
  node scripts/update-phase-status.js 3 summary        # Phase 3 요약 보기

Phase 목록:
${Object.entries(PHASES).map(([num, name]) => `  ${num}. ${name}`).join('\n')}
  `);
}

// 메인 실행
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  showHelp();
  process.exit(0);
}

const phaseNumber = parseInt(args[0]);
const command = args[1];

if (!PHASES[phaseNumber]) {
  console.error(`❌ 잘못된 Phase 번호입니다. (1-9)`);
  showHelp();
  process.exit(1);
}

if (command === 'summary') {
  showPhaseSummary(phaseNumber);
} else {
  const taskIndex = parseInt(command);
  const complete = !args.includes('--incomplete');

  if (isNaN(taskIndex)) {
    console.error(`❌ 잘못된 작업 번호입니다.`);
    showHelp();
    process.exit(1);
  }

  updatePhaseTask(phaseNumber, taskIndex, complete);
  console.log('\n현재 Phase 상태:');
  showPhaseSummary(phaseNumber);
}
