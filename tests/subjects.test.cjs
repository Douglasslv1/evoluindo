const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
const { createService } = require('../lib/service.cjs');

test('disciplinas independentes podem ser vinculadas e removidas das turmas', async () => {
  const base = path.resolve(__dirname, '..', 'test-output');
  fs.mkdirSync(base, { recursive: true });
  const directory = fs.mkdtempSync(path.join(base, 'evoluindo-subjects-')),
    file = path.join(directory, 'data.json');
  try {
    const service = createService({ file }),
      login = await service.execute('setup', { password: 'senha-de-teste-forte' }),
      teacher = await service.session(login.token);
    const classroom = (await service.execute('create-class', { name: 'Mecânica 2027' }, teacher)).classroom;
    const created = await service.execute(
        'create-subject',
        {
          name: 'Desenho Mecânico',
          description: 'Disciplina cadastrada, sem vínculo fixo com AutoCAD.',
          classId: classroom.id
        },
        teacher
      ),
      subject = created.subject;
    assert.equal(created.classSubject.class_id, classroom.id);
    assert.equal(created.classSubject.subject_id, subject.id);
    const teacherState = await service.execute('teacher-state', {}, teacher),
      core = teacherState.subjects.find(item => item.system_key === 'informatica-basica');
    assert.ok(core);
    assert.equal(teacherState.subjects.length, 2);
    let report = await service.execute('class-report', { classId: classroom.id }, teacher);
    assert.deepEqual(
      new Set(report.subjects.map(item => item.name)),
      new Set(['Informática Básica', 'Desenho Mecânico'])
    );
    const registered = await service.execute('register', {
        classCode: classroom.code,
        name: 'Aluno Teste',
        pin: '123456'
      }),
      student = await service.session(registered.token);
    let studentState = await service.execute('me', {}, student);
    assert.deepEqual(new Set(studentState.subjects.map(item => item.id)), new Set([core.id, subject.id]));
    assert.equal(studentState.lessons.length, 10);
    assert.equal(studentState.courseSubject.id, core.id);
    await service.execute(
      'set-class-subject',
      { classId: classroom.id, subjectId: subject.id, assigned: false },
      teacher
    );
    report = await service.execute('class-report', { classId: classroom.id }, teacher);
    assert.deepEqual(
      report.subjects.map(item => item.id),
      [core.id]
    );
    await service.execute(
      'set-class-subject',
      { classId: classroom.id, subjectId: core.id, assigned: false },
      teacher
    );
    studentState = await service.execute('me', {}, student);
    assert.equal(studentState.lessons.length, 0);
    assert.equal(studentState.courseSubject, null);
    await assert.rejects(() => service.execute('lesson', { id: 1 }, student), { status: 403 });
    await assert.rejects(
      () => service.execute('create-subject', { name: 'desenho mecânico' }, teacher),
      /Já existe/
    );
  } finally {
    if (path.dirname(path.resolve(directory)) !== base) throw Error('Diretório de teste inválido.');
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
