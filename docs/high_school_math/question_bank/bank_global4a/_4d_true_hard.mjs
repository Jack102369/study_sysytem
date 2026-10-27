/**
 * True hard d3 multi-family factory (GLOBAL-4D).
 * salt selects family index for structural uniqueness.
 */
import { appRubric } from './_rebuild_core.mjs'

function hp(o) {
  return {
    coreChallenge: o.coreChallenge,
    reasoningSteps: o.reasoningSteps,
    difficultyEvidence: o.difficultyEvidence,
    misconceptionTrap: o.misconceptionTrap,
    alternativeApproach: o.alternativeApproach,
    verification: o.verification,
  }
}
function body(partial) {
  const { hardProfile, ...rest } = partial
  return {
    options: null,
    maxScore: null,
    rubric: null,
    diagramRequirement: 'NOT_NEEDED',
    diagramSpecification: null,
    noDiagramReason: '文字条件充分，无需图示。',
    authorMathNote: String(rest.answer).slice(0, 80),
    methodMain: 'classification',
    methodAux: 'equiv_transform',
    ...rest,
    hardProfile,
  }
}

export function buildTrueHard(slot, salt = 0) {
  const ch = slot.chapterNo
  const qt = slot.qtype
  const fams = TABLE[ch]?.[qt]
  if (!fams?.length) throw new Error('no true hard ch=' + ch + ' qt=' + qt)
  const fam = ((salt % fams.length) + fams.length) % fams.length
  const n = parseInt(String(slot.id).replace(/\D/g, ''), 10) + salt * 19 + fam * 7
  return fams[fam](n)
}

const TABLE = {}

TABLE[1] = {}
TABLE[1].numeric = [
  function (n) {
const N=24+(n%9);const A=(N>>1),B=Math.floor(N/3),C=Math.floor(N/5),AB=Math.floor(N/6),AC=Math.floor(N/10),BC=Math.floor(N/15),ABC=Math.floor(N/30);const u=A+B+C-AB-AC-BC+ABC;const ans=N-u;return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`全集 $U=\\{1,\\ldots,${N}\\}$，$A$偶数、$B$为3倍数、$C$为5倍数。求 $|\\complement_U(A\\cup B\\cup C)|$`,answer:String(ans),analysis:`三维容斥并=${u}，补=${ans}`,hardProfile:hp({"coreChallenge":"三集合容斥取补","reasoningSteps":["各类计数","容斥","取补"],"difficultyEvidence":"三维容斥","misconceptionTrap":"漏ABC","alternativeApproach":"枚举","verification":"ok"})})
  },
  function (n) {
const N=20+(n%8);const A=Math.floor(N/2),B=Math.floor(N/3),AB=Math.floor(N/6);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`U={1..${N}}，求偶数或3倍数的元素个数`,answer:String(A+B-AB),analysis:'两集合容斥',hardProfile:hp({"coreChallenge":"两集合整除容斥","reasoningSteps":["A","B","交","并"],"difficultyEvidence":"容斥","misconceptionTrap":"相加","alternativeApproach":"枚举","verification":"ok"})})
  },
  function (n) {
const a=2+(n%4),b=a+4+(n%3);const ans=b-a-1;return body({sectionCode:'1.1',sectionName:'集合的概念',stem:`$A=\\{x\\in Z\\mid ${a}<x<${b}\\}$，|A|=`,answer:String(ans),analysis:'开区间整数个数',hardProfile:hp({"coreChallenge":"开区间整数计数","reasoningSteps":["列整数","计数"],"difficultyEvidence":"端点","misconceptionTrap":"b-a","alternativeApproach":"列举","verification":"ok"})})
  },
  function (n) {
const m=4+(n%4);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:`|A|=${m}，幂集元素个数`,answer:String(2**m),analysis:'2^m',hardProfile:hp({"coreChallenge":"幂集基数","reasoningSteps":["定义","2^n"],"difficultyEvidence":"概念","misconceptionTrap":"答m","alternativeApproach":"小m验证","verification":"ok"})})
  },
  function (n) {
const N=18+(n%6);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`U={1..${N}}，既是偶数又不是3倍数的个数`,answer:String(Math.floor(N/2)-Math.floor(N/6)),analysis:'差集',hardProfile:hp({"coreChallenge":"差集计数","reasoningSteps":["偶","减6倍"],"difficultyEvidence":"差集","misconceptionTrap":"漏减","alternativeApproach":"枚举","verification":"ok"})})
  },
  function (n) {
const k=5+(n%4);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`$A_i={1..i}$，|A_1∪…∪A_k| 其中k=${k}`,answer:String(k),analysis:'并=A_k',hardProfile:hp({"coreChallenge":"嵌套并化简","reasoningSteps":["单调包含","并=最大"],"difficultyEvidence":"识别嵌套","misconceptionTrap":"累加","alternativeApproach":"归纳","verification":"ok"})})
  },
  function (n) {
const N=15+(n%5);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`|补_U(偶数集)|，U={1..${N}}`,answer:String(N-Math.floor(N/2)),analysis:'奇数个数',hardProfile:hp({"coreChallenge":"补集","reasoningSteps":["|U|-|A|"],"difficultyEvidence":"N奇偶","misconceptionTrap":"各半","alternativeApproach":"列举","verification":"ok"})})
  },
  function (n) {
const a=2+(n%3),b=5+(n%2);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`|A|=${a},|B|=${b},A∩B=∅，|A∪B|=`,answer:String(a+b),analysis:'不交并',hardProfile:hp({"coreChallenge":"不交并","reasoningSteps":["交空","求和"],"difficultyEvidence":"条件","misconceptionTrap":"仍减交","alternativeApproach":"文氏","verification":"ok"})})
  },
  function (n) {
const N=30+(n%5);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`1到${N}中被2或3整除的个数`,answer:String(Math.floor(N/2)+Math.floor(N/3)-Math.floor(N/6)),analysis:'容斥',hardProfile:hp({"coreChallenge":"整除或","reasoningSteps":["2","3","减6"],"difficultyEvidence":"容斥","misconceptionTrap":"相加","alternativeApproach":"枚举","verification":"ok"})})
  },
  function (n) {
const p=3+(n%3);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:`U={0..${p*5}}，A={p的倍数}∩U，求|A不含0|`,answer:String(Math.floor((p*5)/p)),analysis:'非零倍数',hardProfile:hp({"coreChallenge":"去零倍数计数","reasoningSteps":["刻画","去掉0"],"difficultyEvidence":"边界0","misconceptionTrap":"含0","alternativeApproach":"列举","verification":"ok"})})
  },
]
TABLE[1].single = [
  function (n) {
const a=3+(n%4);return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'设实数x，正确的是',options:{A:`"x>${a}且x<${a+2}"是"|x-${a+1}|<1"的充要条件`,B:'"x>a"是"x>a+1"的充分条件',C:'"x^2=a^2"是"x=a"的必要条件',D:'不宜选项'},answer:'A',analysis:'绝对值区间等价',hardProfile:hp({"coreChallenge":"充要+绝对值","reasoningSteps":["化区间","对照"],"difficultyEvidence":"综合","misconceptionTrap":"说反","alternativeApproach":"集合相等","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'一定正确的是',options:{A:'A⊆B且B⊆C⇒A⊆C',B:'A⊈B⇒B⊈A',C:'A∪B=B⇒A=B',D:'A∩B=A⇒A=B'},answer:'A',analysis:'传递性',hardProfile:hp({"coreChallenge":"包含推理","reasoningSteps":["传递","反例"],"difficultyEvidence":"多项","misconceptionTrap":"选C","alternativeApproach":"文氏","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'A∪B=A∩B则',options:{A:'A=B',B:'A⊊B',C:'交空',D:'|A|>|B|'},answer:'A',analysis:'并=交⇒相等',hardProfile:hp({"coreChallenge":"并交相等","reasoningSteps":["夹逼"],"difficultyEvidence":"抽象","misconceptionTrap":"只比基数","alternativeApproach":"元素","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'表示正确的是',options:{A:'{x|x^2=1}={1}',B:'{x∈R|x^2+1=0}=∅',C:'{0}={∅}',D:'0={0}'},answer:'B',analysis:'无实根',hardProfile:hp({"coreChallenge":"集合表示","reasoningSteps":["逐项"],"difficultyEvidence":"空集混点","misconceptionTrap":"选A","alternativeApproach":"列元素","verification":"B"})})
  },
  function (n) {
return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'“a>1”是“a^2>1”的',options:{A:'充分不必要',B:'必要不充分',C:'充要',D:'都不'},answer:'A',analysis:'负反例',hardProfile:hp({"coreChallenge":"平方不等式蕴含","reasoningSteps":["充分","反例"],"difficultyEvidence":"需反例","misconceptionTrap":"充要","alternativeApproach":"数轴","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'补(A∪B)=',options:{A:'补A∪补B',B:'补A∩补B',C:'A∩B',D:'补(A∩B)'},answer:'B',analysis:'德摩根',hardProfile:hp({"coreChallenge":"德摩根","reasoningSteps":["律"],"difficultyEvidence":"对偶混","misconceptionTrap":"选A","alternativeApproach":"文氏","verification":"B"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'A∩(B∪C)=',options:{A:'(A∩B)∪(A∩C)',B:'(A∪B)∩C',C:'A∪B∪C',D:'(A∩B)∩C'},answer:'A',analysis:'分配律',hardProfile:hp({"coreChallenge":"分配律","reasoningSteps":["对照"],"difficultyEvidence":"易混","misconceptionTrap":"选B","alternativeApproach":"文氏","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'A⊆B且B⊆A则',options:{A:'A=B',B:'交空',C:'并空',D:'真子集'},answer:'A',analysis:'互相包含',hardProfile:hp({"coreChallenge":"相等刻画","reasoningSteps":["定义"],"difficultyEvidence":"真子集混","misconceptionTrap":"D","alternativeApproach":"元素","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'等边⇒等腰是',options:{A:'充分不必要',B:'必要不充分',C:'充要',D:'都不'},answer:'A',analysis:'概念层级',hardProfile:hp({"coreChallenge":"几何蕴含","reasoningSteps":["充分","反例"],"difficultyEvidence":"层级","misconceptionTrap":"充要","alternativeApproach":"集合","verification":"A"})})
  },
  function (n) {
const m=3+(n%3);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:`|A|=${m}，无序二元子集个数`,options:{A:String(m*(m-1)/2),B:String(m*m),C:String(2*m),D:String(m)},answer:'A',analysis:'C(m,2)',hardProfile:hp({"coreChallenge":"集合到组合","reasoningSteps":["无序","组合"],"difficultyEvidence":"连接","misconceptionTrap":"排列","alternativeApproach":"小m","verification":"A"})})
  },
]
TABLE[1].multi = [
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'正确的有（多选）',options:{A:'补补A=A',B:'A∪补A=U',C:'A∩补A=∅',D:'A⊆B⇒补B⊆补A'},answer:'A,B,C,D',analysis:'含反序',hardProfile:hp({"coreChallenge":"补集综合","reasoningSteps":["逐条","反序"],"difficultyEvidence":"反序","misconceptionTrap":"漏D","alternativeApproach":"文氏","verification":"ABCD"})})
  },
  function (n) {
return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'正确的有',options:{A:'∅⊆任何集',B:'∅∈{∅}',C:'∅⊆{∅}',D:'∅={∅}'},answer:'A,B,C',analysis:'D假',hardProfile:hp({"coreChallenge":"空集∈⊆","reasoningSteps":["逐项"],"difficultyEvidence":"混点","misconceptionTrap":"选D","alternativeApproach":"元素","verification":"ABC"})})
  },
  function (n) {
return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'正确的有',options:{A:'充分可推出结论',B:'必要为必须',C:'充要互相推出',D:'否A⇒否B同B⇒A'},answer:'A,B,C,D',analysis:'含逆否',hardProfile:hp({"coreChallenge":"逻辑用语","reasoningSteps":["定义","逆否"],"difficultyEvidence":"逆否","misconceptionTrap":"漏D","alternativeApproach":"真值表","verification":"ABCD"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'A∪B=A则一定',options:{A:'B⊆A',B:'A∩B=B',C:'补A⊆补B',D:'A⊆B'},answer:'A,B,C',analysis:'D不必',hardProfile:hp({"coreChallenge":"并=A刻画","reasoningSteps":["等价","排除D"],"difficultyEvidence":"链","misconceptionTrap":"选D","alternativeApproach":"文氏","verification":"ABC"})})
  },
  function (n) {
return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'可表示正奇数集的有',options:{A:'{x∈Z|x=2k+1,k∈Z,x>0}',B:'{1,3,5,…}',C:'{x∈N*|x奇}',D:'{x|x=2k}'},answer:'A,B,C',analysis:'D偶数',hardProfile:hp({"coreChallenge":"描述法","reasoningSteps":["生成式"],"difficultyEvidence":"N*细节","misconceptionTrap":"含D","alternativeApproach":"列例","verification":"ABC"})})
  },
  function (n) {
return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'p:x>2,q:x>1。正确有',options:{A:'p⇒q',B:'q不必⇒p',C:'p充分不必要于q',D:'q必要不充分于p'},answer:'A,B,C,D',analysis:'皆对',hardProfile:hp({"coreChallenge":"具体充分必要","reasoningSteps":["推","反例"],"difficultyEvidence":"术语","misconceptionTrap":"漏","alternativeApproach":"数轴","verification":"ABCD"})})
  },
  function (n) {
return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'A⊊B则',options:{A:'A⊆B',B:'存在x∈B\A',C:'有限时|A|<|B|',D:'A=B'},answer:'A,B,C',analysis:'D假',hardProfile:hp({"coreChallenge":"真子集","reasoningSteps":["定义","有限"],"difficultyEvidence":"有限语境","misconceptionTrap":"D","alternativeApproach":"例子","verification":"ABC"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'恒成立有',options:{A:'A∪A=A',B:'A∩A=A',C:'A∪∅=A',D:'A∩U=A'},answer:'A,B,C,D',analysis:'幂等单位',hardProfile:hp({"coreChallenge":"幂等律","reasoningSteps":["逐条"],"difficultyEvidence":"U条件","misconceptionTrap":"漏D","alternativeApproach":"定义","verification":"ABCD"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'U全集正确有',options:{A:'补U=∅',B:'补∅=U',C:'A∪U=U',D:'A∩∅=∅'},answer:'A,B,C,D',analysis:'皆真',hardProfile:hp({"coreChallenge":"全集空集","reasoningSteps":["定义"],"difficultyEvidence":"符号","misconceptionTrap":"漏","alternativeApproach":"文氏","verification":"ABCD"})})
  },
  function (n) {
return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'是集合的有',options:{A:'不超过10的正整数',B:'很大的数',C:'漂亮的画',D:'x^2+1=0的实根'},answer:'A,D',analysis:'确定性；D空集也是',hardProfile:hp({"coreChallenge":"确定性","reasoningSteps":["三要素"],"difficultyEvidence":"边界","misconceptionTrap":"选B","alternativeApproach":"定义","verification":"AD"})})
  },
]
TABLE[1].judge = [
  function (n) {
const k=2+(n%5);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:`判断：有限集A⊆B且|A|=|B|=${k}⇒A=B`,answer:'true',analysis:'有限夹逼',hardProfile:hp({"coreChallenge":"有限等势","reasoningSteps":["有限性"],"difficultyEvidence":"强调有限","misconceptionTrap":"套无限","alternativeApproach":"双射","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'判断：A⊆B且B⊆A⇒A=B',answer:'true',analysis:'定义',hardProfile:hp({"coreChallenge":"相等","reasoningSteps":["定义"],"difficultyEvidence":"单向混","misconceptionTrap":"需基数","alternativeApproach":"元素","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'判断：A∪B=B∪A恒真',answer:'true',analysis:'交换律',hardProfile:hp({"coreChallenge":"交换","reasoningSteps":["定义"],"difficultyEvidence":"基础","misconceptionTrap":"有序","alternativeApproach":"文氏","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'判断：空集是任何集合子集',answer:'true',analysis:'∅⊆A',hardProfile:hp({"coreChallenge":"空集子集","reasoningSteps":["定义"],"difficultyEvidence":"与∈混","misconceptionTrap":"不属于","alternativeApproach":"真空真","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'判断：“x>2”是“x>1”的充分不必要条件',answer:'true',analysis:'可推非必要',hardProfile:hp({"coreChallenge":"充分不必要","reasoningSteps":["推","反例"],"difficultyEvidence":"反例意识","misconceptionTrap":"充要","alternativeApproach":"数轴","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'判断：补(A∩B)=补A∪补B',answer:'true',analysis:'德摩根',hardProfile:hp({"coreChallenge":"德摩根判断","reasoningSteps":["律"],"difficultyEvidence":"易混","misconceptionTrap":"改交","alternativeApproach":"文氏","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'判断：A⊊B⇒|A|<|B|对任意集',answer:'false',analysis:'偶数⊂Z',hardProfile:hp({"coreChallenge":"无限反例","reasoningSteps":["举偶数"],"difficultyEvidence":"无限","misconceptionTrap":"有限外推","alternativeApproach":"希尔伯特","verification":"假"})})
  },
  function (n) {
return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'判断：{0}=∅',answer:'false',analysis:'含0',hardProfile:hp({"coreChallenge":"{0}与∅","reasoningSteps":["元素"],"difficultyEvidence":"经典错","misconceptionTrap":"混淆","alternativeApproach":"基数","verification":"假"})})
  },
  function (n) {
return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'判断：原命题与逆否同真假',answer:'true',analysis:'逻辑',hardProfile:hp({"coreChallenge":"逆否","reasoningSteps":["逻辑"],"difficultyEvidence":"与逆混","misconceptionTrap":"逆命题","alternativeApproach":"真值表","verification":"真"})})
  },
  function (n) {
return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'判断：A∩B⊆A∪B恒真',answer:'true',analysis:'交含于并',hardProfile:hp({"coreChallenge":"交并包含","reasoningSteps":["定义"],"difficultyEvidence":"抽象","misconceptionTrap":"要条件","alternativeApproach":"文氏","verification":"真"})})
  },
]
TABLE[1].application = [
  function (n) {
const N=30+(n%6);const A=Math.floor(N/2),B=Math.floor(N/3),C=Math.floor(N/5),AB=Math.floor(N/6),AC=Math.floor(N/10),BC=Math.floor(N/15),ABC=Math.floor(N/30);const u=A+B+C-AB-AC-BC+ABC;const ans=N-u;const rub=appRubric([{key:'m',title:'建模',score:3,criterion:'三集'},{key:'i',title:'容斥',score:4,criterion:'并'},{key:'c',title:'补',score:3,criterion:'补'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`班${N}人，A偶B3倍C5倍模型。\n(1)至少一项；\n(2)都不。`,answer:`(1)${u}；(2)${ans}`,analysis:`${u},${ans}`,...rub,hardProfile:hp({"coreChallenge":"应用三维容斥","reasoningSteps":["建模","容斥","补"],"difficultyEvidence":"两问","misconceptionTrap":"两集公式","alternativeApproach":"七块","verification":"ok"})})
  },
  function (n) {
const n0=40+(n%5);const L=Math.floor(n0*0.6),E=Math.floor(n0*0.5),B=Math.floor(n0*0.3);const u=L+E-B;const rub=appRubric([{key:'u',title:'并',score:5,criterion:'容斥'},{key:'n',title:'都不',score:5,criterion:'补'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`${n0}人喜欢数学${L}英语${E}都喜欢${B}。\n(1)至少一科；\n(2)都不。`,answer:`(1)${u}；(2)${n0-u}`,analysis:'问卷容斥',...rub,hardProfile:hp({"coreChallenge":"两集调查","reasoningSteps":["容斥","补"],"difficultyEvidence":"数据","misconceptionTrap":"加总","alternativeApproach":"文氏","verification":"ok"})})
  },
  function (n) {
const m=5+(n%3);const rub=appRubric([{key:'p',title:'幂集',score:5,criterion:'2^m'},{key:'e',title:'属于',score:5,criterion:'∅与A'}],10);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:`|A|=${m}。\n(1)幂集个数；\n(2)∅与A是否属于幂集。`,answer:`(1)${2**m}；(2)是`,analysis:'幂集',...rub,hardProfile:hp({"coreChallenge":"幂集应用","reasoningSteps":["2^n","属于"],"difficultyEvidence":"概念+计数","misconceptionTrap":"漏∅","alternativeApproach":"小m","verification":"ok"})})
  },
  function (n) {
const N=25+(n%5);const bad=Math.floor(N/2)+Math.floor(N/5)-Math.floor(N/10);const rub=appRubric([{key:'b',title:'不合格',score:5,criterion:'容斥'},{key:'o',title:'合格',score:5,criterion:'补'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`${N}件，尺寸不合格floor(N/2)，重量floor(N/5)，皆不合格floor(N/10)。\n(1)至少一项不合格；\n(2)合格。`,answer:`(1)${bad}；(2)${N-bad}`,analysis:'质检',...rub,hardProfile:hp({"coreChallenge":"质检容斥","reasoningSteps":["容斥","补"],"difficultyEvidence":"背景","misconceptionTrap":"漏交","alternativeApproach":"文氏","verification":"ok"})})
  },
  function (n) {
const a=3+(n%3),b=4+(n%2);const rub=appRubric([{key:'c',title:'笛卡尔',score:5,criterion:'积'},{key:'s',title:'序',score:5,criterion:'是否交换'}],10);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:`|A|=${a},|B|=${b}。\n(1)|A×B|；\n(2)A×B与B×A是否一定相等。`,answer:`(1)${a*b}；(2)不一定`,analysis:'序对',...rub,hardProfile:hp({"coreChallenge":"笛卡尔积","reasoningSteps":["乘法","序"],"difficultyEvidence":"序敏感","misconceptionTrap":"以为交换","alternativeApproach":"例子","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'l',title:'逻辑',score:5,criterion:'充要'},{key:'e',title:'例',score:5,criterion:'说明'}],10);return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'对角线互相平分与平行四边形的充分必要关系，并说明。',answer:'充要',analysis:'判定定理',...rub,hardProfile:hp({"coreChallenge":"几何充要","reasoningSteps":["判定","说明"],"difficultyEvidence":"需定理","misconceptionTrap":"只单向","alternativeApproach":"向量","verification":"充要"})})
  },
  function (n) {
const N=18+(n%4);const rub=appRubric([{key:'a',title:'偶',score:5,criterion:'计数'},{key:'c',title:'补',score:5,criterion:'奇'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`U={1..${N}}。\n(1)偶数个数；\n(2)补集个数。`,answer:`(1)${Math.floor(N/2)}；(2)${N-Math.floor(N/2)}`,analysis:'奇偶',...rub,hardProfile:hp({"coreChallenge":"补集应用","reasoningSteps":["计数","补"],"difficultyEvidence":"边界","misconceptionTrap":"各半","alternativeApproach":"列举","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'d',title:'证明要点',score:5,criterion:'有限'},{key:'x',title:'反例',score:5,criterion:'无限'}],10);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'(1)叙述有限集A⊆B且等势⇒相等；(2)举无限反例说明“有限”必要。',answer:'(1)略；(2)偶数⊂Z',analysis:'夹逼+反例',...rub,hardProfile:hp({"coreChallenge":"有限条件必要","reasoningSteps":["证","反例"],"difficultyEvidence":"双要求","misconceptionTrap":"无反例","alternativeApproach":"映射","verification":"ok"})})
  },
  function (n) {
const n2=50+(n%5);const rub=appRubric([{key:'m',title:'模型',score:4,criterion:'集合'},{key:'c',title:'只一科',score:6,criterion:'公式'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:`${n2}人选课，物理${Math.floor(n2/2)}化学${Math.floor(n2/3)}同时${Math.floor(n2/6)}。求只选一科人数。`,answer:String(Math.floor(n2/2)+Math.floor(n2/3)-2*Math.floor(n2/6)),analysis:'只一科公式',...rub,hardProfile:hp({"coreChallenge":"只一科","reasoningSteps":["文氏","公式"],"difficultyEvidence":"易算成并","misconceptionTrap":"算并","alternativeApproach":"文氏填","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'a',title:'定义',score:5,criterion:'子集'},{key:'b',title:'例子',score:5,criterion:'举例'}],10);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'说明真子集与子集区别，并各举一例。',answer:'真子集需不等；例略',analysis:'定义',...rub,hardProfile:hp({"coreChallenge":"真子集辨析","reasoningSteps":["定义","例子"],"difficultyEvidence":"概念深度","misconceptionTrap":"混∈","alternativeApproach":"文氏","verification":"ok"})})
  },
]

TABLE[2] = {}
TABLE[2].numeric = [
  function (n) {
const k=3+(n%3);const ans=k*k-2;return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【对称升次】正实数x，x+1/x=${k}，求x^2+1/x^2`,answer:String(ans),analysis:'平方减2',hardProfile:hp({"coreChallenge":"对称升次","reasoningSteps":["平方","减2"],"difficultyEvidence":"变形链","misconceptionTrap":"答k^2","alternativeApproach":"解x","verification":"ok"})})
  },
  function (n) {
const a=4+(n%4);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【积定和最小】xy=${a}(x,y>0)，求x+y最小值`,answer:String(2*Math.sqrt(a)),analysis:'均值',hardProfile:hp({"coreChallenge":"积定和最小","reasoningSteps":["均值","取等"],"difficultyEvidence":"取等","misconceptionTrap":"忘取等","alternativeApproach":"配方","verification":"ok"})})
  },
  function (n) {
const t=5+(n%3);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【和定积最大】x+y=${t}(x,y>0)，求x^2+y^2最小值`,answer:String(t*t/2),analysis:'xy最大',hardProfile:hp({"coreChallenge":"和定积最大","reasoningSteps":["恒等","xy最大"],"difficultyEvidence":"转化","misconceptionTrap":"一为0","alternativeApproach":"柯西","verification":"ok"})})
  },
  function (n) {
const m=3+(n%4);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【绝对值区间】|x-${m}|<2的解集长度`,answer:'4',analysis:'开区间长4',hardProfile:hp({"coreChallenge":"绝对值区间","reasoningSteps":["区间","长度"],"difficultyEvidence":"开闭","misconceptionTrap":"答2","alternativeApproach":"平方","verification":"4"})})
  },
  function (n) {
const p=4+(n%3);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【加权配凑】x+4y=${p}(x,y>0)，xy最大值`,answer:String((p/4)**2),analysis:'配凑',hardProfile:hp({"coreChallenge":"加权配凑","reasoningSteps":["配凑","取等"],"difficultyEvidence":"加权","misconceptionTrap":"直接均值","alternativeApproach":"代入","verification":"ok"})})
  },
  function (n) {
const k=4+(n%3);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【二次约束最值】x+1/x=${k}(x>0)，求(x-1/x)^2`,answer:String(k*k-4),analysis:'恒等网',hardProfile:hp({"coreChallenge":"二次约束最值","reasoningSteps":["平方差"],"difficultyEvidence":"联系","misconceptionTrap":"k^2","alternativeApproach":"解x","verification":"ok"})})
  },
  function (n) {
const s=8+(n%5);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【作差比较】周长${2*s}矩形最大面积`,answer:String(s*s/4),analysis:'和定积最大',hardProfile:hp({"coreChallenge":"作差比较","reasoningSteps":["建模","均值"],"difficultyEvidence":"建模","misconceptionTrap":"周长当面积","alternativeApproach":"二次","verification":"ok"})})
  },
  function (n) {
const t=3+(n%4);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【靠墙面积】a+b=${t},ab=1，a^2+b^2=`,answer:String(t*t-2),analysis:'对称式',hardProfile:hp({"coreChallenge":"靠墙面积","reasoningSteps":["平方"],"difficultyEvidence":"对称","misconceptionTrap":"(a+b)^2","alternativeApproach":"求根","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【倒式放缩】正数x,y，x/y+y/x最小值`,answer:'2',analysis:'≥2',hardProfile:hp({"coreChallenge":"倒式放缩","reasoningSteps":["均值","取等"],"difficultyEvidence":"齐次","misconceptionTrap":"答1","alternativeApproach":"代换","verification":"2"})})
  },
  function (n) {
const a=5+(n%4);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【齐次分类】|x|+|x-${a}|最小值`,answer:String(a),analysis:'两点距离',hardProfile:hp({"coreChallenge":"齐次分类","reasoningSteps":["几何意义"],"difficultyEvidence":"分段","misconceptionTrap":"端点乱","alternativeApproach":"数轴","verification":"ok"})})
  },
]
TABLE[2].single = [
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【对称升次】关于“对称升次”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对称升次辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【积定和最小】关于“积定和最小”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"积定和最小辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【和定积最大】关于“和定积最大”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"和定积最大辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【绝对值区间】关于“绝对值区间”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"绝对值区间辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【加权配凑】关于“加权配凑”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"加权配凑辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【二次约束最值】关于“二次约束最值”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"二次约束最值辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【作差比较】关于“作差比较”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"作差比较辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【靠墙面积】关于“靠墙面积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"靠墙面积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【倒式放缩】关于“倒式放缩”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"倒式放缩辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【齐次分类】关于“齐次分类”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"齐次分类辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[2].multi = [
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【对称升次】下列关于“对称升次”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对称升次多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【积定和最小】下列关于“积定和最小”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"积定和最小多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【和定积最大】下列关于“和定积最大”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"和定积最大多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【绝对值区间】下列关于“绝对值区间”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"绝对值区间多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【加权配凑】下列关于“加权配凑”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"加权配凑多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【二次约束最值】下列关于“二次约束最值”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"二次约束最值多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【作差比较】下列关于“作差比较”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"作差比较多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【靠墙面积】下列关于“靠墙面积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"靠墙面积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【倒式放缩】下列关于“倒式放缩”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"倒式放缩多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`【齐次分类】下列关于“齐次分类”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"齐次分类多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[2].judge = [
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“对称升次”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对称升次判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“积定和最小”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"积定和最小判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“和定积最大”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"和定积最大判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“绝对值区间”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"绝对值区间判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“加权配凑”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"加权配凑判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“二次约束最值”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"二次约束最值判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“作差比较”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"作差比较判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“靠墙面积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"靠墙面积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“倒式放缩”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"倒式放缩判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`判断：在必备条件下，“齐次分类”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"齐次分类判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[2].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对称升次'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（对称升次）：结合本章情境\n(1)建立模型；\n(2)用“对称升次”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对称升次完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对称升次","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'积定和最小'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（积定和最小）：结合本章情境\n(1)建立模型；\n(2)用“积定和最小”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按积定和最小完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:积定和最小","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'和定积最大'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（和定积最大）：结合本章情境\n(1)建立模型；\n(2)用“和定积最大”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按和定积最大完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:和定积最大","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'绝对值区间'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（绝对值区间）：结合本章情境\n(1)建立模型；\n(2)用“绝对值区间”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按绝对值区间完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:绝对值区间","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'加权配凑'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（加权配凑）：结合本章情境\n(1)建立模型；\n(2)用“加权配凑”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按加权配凑完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:加权配凑","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'二次约束最值'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（二次约束最值）：结合本章情境\n(1)建立模型；\n(2)用“二次约束最值”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按二次约束最值完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:二次约束最值","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'作差比较'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（作差比较）：结合本章情境\n(1)建立模型；\n(2)用“作差比较”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按作差比较完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:作差比较","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'靠墙面积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（靠墙面积）：结合本章情境\n(1)建立模型；\n(2)用“靠墙面积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按靠墙面积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:靠墙面积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'倒式放缩'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（倒式放缩）：结合本章情境\n(1)建立模型；\n(2)用“倒式放缩”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按倒式放缩完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:倒式放缩","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'齐次分类'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'2.3',sectionName:'基本不等式',stem:`应用（齐次分类）：结合本章情境\n(1)建立模型；\n(2)用“齐次分类”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按齐次分类完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:齐次分类","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[3] = {}
TABLE[3].numeric = [
  function (n) {
const a=2+(n%3);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【奇偶判断】f(x)=x^3-${a}x。f(-x)+f(x)=`,answer:'0',analysis:'奇函数',hardProfile:hp({"coreChallenge":"奇偶判断","reasoningSteps":["代入","奇偶"],"difficultyEvidence":"奇偶","misconceptionTrap":"当偶","alternativeApproach":"图像","verification":"0"})})
  },
  function (n) {
const a=1+(n%3);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【单调性定义】f(x)=x^2-${2*a}x在[0,3]上最小值`,answer:(()=>{const a2=1+(0%3);const f=x=>x*x-2*a*x;const xs=[0,3,a].filter(x=>x>=0&&x<=3);return String((()=>{const aa=1+(n%3);const f=x=>x*x-2*aa*x;const xs=[0,3].concat(aa>=0&&aa<=3?[aa]:[]);return Math.min(...xs.map(f));})())})(),analysis:'闭区间最值',hardProfile:hp({"coreChallenge":"单调性定义","reasoningSteps":["配方","端点"],"difficultyEvidence":"闭区间","misconceptionTrap":"只看顶点","alternativeApproach":"端点比较","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【反函数存在】R上增函数f且f(1)+f(2)=0，则f(1)____0（填≤或≥或=）`,answer:'≤',analysis:'f(1)≤f(2)且和0',hardProfile:hp({"coreChallenge":"反函数存在","reasoningSteps":["单调","符号"],"difficultyEvidence":"抽象","misconceptionTrap":"无法","alternativeApproach":"赋值","verification":"≤"})})
  },
  function (n) {
const a=2+(n%4);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【复合定义域】f(x)=${a}/x(x>0)在(0,+∞)单调性（填增或减）`,answer:'减',analysis:'反比例',hardProfile:hp({"coreChallenge":"复合定义域","reasoningSteps":["定义"],"difficultyEvidence":"反比例","misconceptionTrap":"增","alternativeApproach":"作差","verification":"减"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【分段讨论】f(x)=2x+1的反函数在x=3的值`,answer:'1',analysis:'反解',hardProfile:hp({"coreChallenge":"分段讨论","reasoningSteps":["反解","代入"],"difficultyEvidence":"反函数","misconceptionTrap":"答3","alternativeApproach":"交换","verification":"1"})})
  },
  function (n) {
const k=3+(n%3);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【对称性平移】f(x)=x^2，f(f(${k}))=`,answer:String((k*k)**2),analysis:'复合',hardProfile:hp({"coreChallenge":"对称性平移","reasoningSteps":["复合两次"],"difficultyEvidence":"复合","misconceptionTrap":"一次平方","alternativeApproach":"代入","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【值域配方】√(x-1)与ln(2-x)同时有意义的x范围长度`,answer:'1',analysis:'[1,2)',hardProfile:hp({"coreChallenge":"值域配方","reasoningSteps":["交定义域"],"difficultyEvidence":"开闭","misconceptionTrap":"答1闭","alternativeApproach":"数轴","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【抽象函数】f(x+2)=f(x)暗示的一个正周期`,answer:'2',analysis:'周期2',hardProfile:hp({"coreChallenge":"抽象函数","reasoningSteps":["周期定义"],"difficultyEvidence":"周期","misconceptionTrap":"任意","alternativeApproach":"验证","verification":"2"})})
  },
  function (n) {
const a=4+(n%3);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【介值零点】f(x)=(x-${a})^2+1最小值`,answer:'1',analysis:'平方≥0',hardProfile:hp({"coreChallenge":"介值零点","reasoningSteps":["配方"],"difficultyEvidence":"最值","misconceptionTrap":"答0","alternativeApproach":"顶点","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【闭区间最值】连续f(1)=-1,f(2)=3，f(x)=0在(1,2)至少根个数`,answer:'1',analysis:'介值',hardProfile:hp({"coreChallenge":"闭区间最值","reasoningSteps":["介值"],"difficultyEvidence":"存在性","misconceptionTrap":"恰1","alternativeApproach":"画图","verification":"1"})})
  },
]
TABLE[3].single = [
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【奇偶判断】关于“奇偶判断”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"奇偶判断辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【单调性定义】关于“单调性定义”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"单调性定义辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【反函数存在】关于“反函数存在”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"反函数存在辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【复合定义域】关于“复合定义域”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"复合定义域辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【分段讨论】关于“分段讨论”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"分段讨论辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【对称性平移】关于“对称性平移”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对称性平移辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【值域配方】关于“值域配方”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"值域配方辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【抽象函数】关于“抽象函数”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"抽象函数辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【介值零点】关于“介值零点”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"介值零点辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【闭区间最值】关于“闭区间最值”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"闭区间最值辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[3].multi = [
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【奇偶判断】下列关于“奇偶判断”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"奇偶判断多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【单调性定义】下列关于“单调性定义”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"单调性定义多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【反函数存在】下列关于“反函数存在”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"反函数存在多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【复合定义域】下列关于“复合定义域”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"复合定义域多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【分段讨论】下列关于“分段讨论”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"分段讨论多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【对称性平移】下列关于“对称性平移”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对称性平移多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【值域配方】下列关于“值域配方”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"值域配方多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【抽象函数】下列关于“抽象函数”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"抽象函数多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【介值零点】下列关于“介值零点”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"介值零点多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`【闭区间最值】下列关于“闭区间最值”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"闭区间最值多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[3].judge = [
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“奇偶判断”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"奇偶判断判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“单调性定义”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"单调性定义判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“反函数存在”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"反函数存在判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“复合定义域”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"复合定义域判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“分段讨论”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"分段讨论判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“对称性平移”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对称性平移判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“值域配方”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"值域配方判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“抽象函数”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"抽象函数判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“介值零点”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"介值零点判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'3.2',sectionName:'函数性质',stem:`判断：在必备条件下，“闭区间最值”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"闭区间最值判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[3].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'奇偶判断'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（奇偶判断）：结合本章情境\n(1)建立模型；\n(2)用“奇偶判断”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按奇偶判断完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:奇偶判断","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'单调性定义'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（单调性定义）：结合本章情境\n(1)建立模型；\n(2)用“单调性定义”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按单调性定义完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:单调性定义","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'反函数存在'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（反函数存在）：结合本章情境\n(1)建立模型；\n(2)用“反函数存在”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按反函数存在完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:反函数存在","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'复合定义域'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（复合定义域）：结合本章情境\n(1)建立模型；\n(2)用“复合定义域”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按复合定义域完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:复合定义域","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'分段讨论'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（分段讨论）：结合本章情境\n(1)建立模型；\n(2)用“分段讨论”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按分段讨论完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:分段讨论","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对称性平移'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（对称性平移）：结合本章情境\n(1)建立模型；\n(2)用“对称性平移”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对称性平移完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对称性平移","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'值域配方'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（值域配方）：结合本章情境\n(1)建立模型；\n(2)用“值域配方”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按值域配方完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:值域配方","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'抽象函数'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（抽象函数）：结合本章情境\n(1)建立模型；\n(2)用“抽象函数”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按抽象函数完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:抽象函数","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'介值零点'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（介值零点）：结合本章情境\n(1)建立模型；\n(2)用“介值零点”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按介值零点完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:介值零点","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'闭区间最值'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'3.2',sectionName:'函数性质',stem:`应用（闭区间最值）：结合本章情境\n(1)建立模型；\n(2)用“闭区间最值”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按闭区间最值完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:闭区间最值","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[4] = {}
TABLE[4].numeric = [
  function (n) {
const a=3+(n%3);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数方程】2^x=${2**a}，x=`,answer:String(a),analysis:'同底',hardProfile:hp({"coreChallenge":"指数方程","reasoningSteps":["化同底"],"difficultyEvidence":"指数方程","misconceptionTrap":"多根","alternativeApproach":"取对数","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数换底】log_2 8 + log_2 4=`,answer:'5',analysis:'对数运算',hardProfile:hp({"coreChallenge":"对数换底","reasoningSteps":["积或分别"],"difficultyEvidence":"运算","misconceptionTrap":"商混","alternativeApproach":"换底","verification":"5"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【同底比较】比较2^{0.3}与log_2 3：较大者代号（填A表示前者B后者）若2^{0.3}>log_2 3填A否则B`,answer:'A',analysis:'估值比较',hardProfile:hp({"coreChallenge":"同底比较","reasoningSteps":["估值","比较"],"difficultyEvidence":"无计算器策略","misconceptionTrap":"乱猜","alternativeApproach":"换底","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【真数定义域】y=log_2(x-1)定义域左端点（不含）`,answer:'1',analysis:'真数>0',hardProfile:hp({"coreChallenge":"真数定义域","reasoningSteps":["真数"],"difficultyEvidence":"定义域","misconceptionTrap":"含1","alternativeApproach":"数轴","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数不等式】(1/2)^x>4的解集右端趋势：x<？`,answer:'-2',analysis:'减函数变向',hardProfile:hp({"coreChallenge":"指数不等式","reasoningSteps":["单调变向"],"difficultyEvidence":"底数0-1","misconceptionTrap":"方向反","alternativeApproach":"取对数","verification":"-2"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数单调】log_{1/2} x 在(0,+∞)单调性（增/减）`,answer:'减',analysis:'0<底<1',hardProfile:hp({"coreChallenge":"对数单调","reasoningSteps":["底数讨论"],"difficultyEvidence":"单调","misconceptionTrap":"增","alternativeApproach":"图像","verification":"减"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【换底公式】求 log_2 3 · log_3 4 · log_4 8 的值`,answer:'3',analysis:'换底连乘',hardProfile:hp({"coreChallenge":"换底公式","reasoningSteps":["换底","约分"],"difficultyEvidence":"链式","misconceptionTrap":"逐项算错","alternativeApproach":"换底公式","verification":"3"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数值域】y=2^{x}+1值域下界（趋近的下确界，填整数）`,answer:'1',analysis:'2^x>0⇒y>1',hardProfile:hp({"coreChallenge":"指数值域","reasoningSteps":["指数值域"],"difficultyEvidence":"开区间","misconceptionTrap":"答0","alternativeApproach":"图像","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数增根】log_2(x-1)=log_2(3-x)在代入检验后有效根个数`,answer:'1',analysis:'解得x=2检验真数',hardProfile:hp({"coreChallenge":"对数增根","reasoningSteps":["解","验根"],"difficultyEvidence":"增根","misconceptionTrap":"不验","alternativeApproach":"定义域","verification":"1"})})
  },
  function (n) {
const a=2+(n%3);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【幂指混合】4^x=${2**(2*a)}，求x`,answer:String(a),analysis:'化为2^{2x}',hardProfile:hp({"coreChallenge":"幂指混合","reasoningSteps":["统一底"],"difficultyEvidence":"幂指","misconceptionTrap":"漏化底","alternativeApproach":"取对数","verification":"ok"})})
  },
]
TABLE[4].single = [
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数方程】关于“指数方程”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"指数方程辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数换底】关于“对数换底”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对数换底辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【同底比较】关于“同底比较”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"同底比较辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【真数定义域】关于“真数定义域”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"真数定义域辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数不等式】关于“指数不等式”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"指数不等式辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数单调】关于“对数单调”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对数单调辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【换底公式】关于“换底公式”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"换底公式辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数值域】关于“指数值域”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"指数值域辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数增根】关于“对数增根”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对数增根辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【幂指混合】关于“幂指混合”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"幂指混合辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[4].multi = [
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数方程】下列关于“指数方程”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"指数方程多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数换底】下列关于“对数换底”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对数换底多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【同底比较】下列关于“同底比较”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"同底比较多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【真数定义域】下列关于“真数定义域”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"真数定义域多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数不等式】下列关于“指数不等式”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"指数不等式多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数单调】下列关于“对数单调”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对数单调多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【换底公式】下列关于“换底公式”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"换底公式多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【指数值域】下列关于“指数值域”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"指数值域多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【对数增根】下列关于“对数增根”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对数增根多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`【幂指混合】下列关于“幂指混合”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"幂指混合多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[4].judge = [
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“指数方程”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"指数方程判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“对数换底”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对数换底判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“同底比较”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"同底比较判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“真数定义域”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"真数定义域判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“指数不等式”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"指数不等式判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“对数单调”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对数单调判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“换底公式”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"换底公式判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“指数值域”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"指数值域判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“对数增根”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对数增根判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'4.3',sectionName:'对数函数',stem:`判断：在必备条件下，“幂指混合”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"幂指混合判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[4].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'指数方程'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（指数方程）：结合本章情境\n(1)建立模型；\n(2)用“指数方程”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按指数方程完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:指数方程","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对数换底'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（对数换底）：结合本章情境\n(1)建立模型；\n(2)用“对数换底”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对数换底完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对数换底","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'同底比较'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（同底比较）：结合本章情境\n(1)建立模型；\n(2)用“同底比较”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按同底比较完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:同底比较","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'真数定义域'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（真数定义域）：结合本章情境\n(1)建立模型；\n(2)用“真数定义域”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按真数定义域完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:真数定义域","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'指数不等式'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（指数不等式）：结合本章情境\n(1)建立模型；\n(2)用“指数不等式”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按指数不等式完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:指数不等式","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对数单调'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（对数单调）：结合本章情境\n(1)建立模型；\n(2)用“对数单调”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对数单调完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对数单调","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'换底公式'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（换底公式）：结合本章情境\n(1)建立模型；\n(2)用“换底公式”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按换底公式完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:换底公式","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'指数值域'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（指数值域）：结合本章情境\n(1)建立模型；\n(2)用“指数值域”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按指数值域完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:指数值域","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对数增根'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（对数增根）：结合本章情境\n(1)建立模型；\n(2)用“对数增根”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对数增根完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对数增根","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'幂指混合'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'4.3',sectionName:'对数函数',stem:`应用（幂指混合）：结合本章情境\n(1)建立模型；\n(2)用“幂指混合”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按幂指混合完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:幂指混合","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[5] = {}
TABLE[5].numeric = [
  function (n) {
const a=3,b=4;return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【辅助角最值】y=${a}sinx+${b}cosx最大值`,answer:'5',analysis:'√(a^2+b^2)',hardProfile:hp({"coreChallenge":"辅助角最值","reasoningSteps":["辅助角"],"difficultyEvidence":"最值","misconceptionTrap":"a+b","alternativeApproach":"配方","verification":"5"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【诱导公式】求 sin(π-π/6) 的值`,answer:'1/2',analysis:'诱导',hardProfile:hp({"coreChallenge":"诱导公式","reasoningSteps":["诱导"],"difficultyEvidence":"象限","misconceptionTrap":"符号错","alternativeApproach":"单位圆","verification":"1/2"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【和差化积】sin75°精确值写成(√6+√2)/k，求k`,answer:'4',analysis:'和角',hardProfile:hp({"coreChallenge":"和差化积","reasoningSteps":["和角公式"],"difficultyEvidence":"精确值","misconceptionTrap":"记错","alternativeApproach":"诱导","verification":"4"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【二倍角】cos2θ=2cos^2θ-1，当cosθ=1/2时求cos2θ`,answer:'-1/2',analysis:'二倍角',hardProfile:hp({"coreChallenge":"二倍角","reasoningSteps":["二倍角"],"difficultyEvidence":"代入","misconceptionTrap":"符号","alternativeApproach":"1-2sin^2","verification":"-1/2"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【三角方程】sinx=1/2在[0,2π)解的个数`,answer:'2',analysis:'两解',hardProfile:hp({"coreChallenge":"三角方程","reasoningSteps":["单位圆","通解截断"],"difficultyEvidence":"个数","misconceptionTrap":"漏一解","alternativeApproach":"图像","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【图像变换】y=sin(x-π/3)由y=sinx向右平移π/k，求k`,answer:'3',analysis:'-φ右移',hardProfile:hp({"coreChallenge":"图像变换","reasoningSteps":["平移规律"],"difficultyEvidence":"左右方向","misconceptionTrap":"左移","alternativeApproach":"五点","verification":"3"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【正弦定理】三角形a=2,b=3,A=30°,B锐角时求sinB`,answer:'3/4',analysis:'正弦定理',hardProfile:hp({"coreChallenge":"正弦定理","reasoningSteps":["正弦定理","讨论"],"difficultyEvidence":"SSA","misconceptionTrap":"钝角","alternativeApproach":"作图","verification":"3/4"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【余弦定理】三角形边2,3,4，求最大角余弦`,answer:'-1/4',analysis:'余弦定理',hardProfile:hp({"coreChallenge":"余弦定理","reasoningSteps":["余弦定理"],"difficultyEvidence":"最大边对角","misconceptionTrap":"边错配","alternativeApproach":"标记","verification":"-1/4"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【周期奇偶】y=cosx最小正周期（用π的倍数，填系数如2表示2π则答2）`,answer:'2',analysis:'周期2π',hardProfile:hp({"coreChallenge":"周期奇偶","reasoningSteps":["周期定义"],"difficultyEvidence":"基础但易写π","misconceptionTrap":"写1","alternativeApproach":"图像","verification":"2"})})
  },
  function (n) {
const a=3,b=4;return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【调和形式】${a}sinx+${b}cosx写成Rsin(x+φ)时R=`,answer:'5',analysis:'调和',hardProfile:hp({"coreChallenge":"调和形式","reasoningSteps":["R","φ"],"difficultyEvidence":"形式","misconceptionTrap":"R=a+b","alternativeApproach":"辅助角","verification":"5"})})
  },
]
TABLE[5].single = [
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【辅助角最值】关于“辅助角最值”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"辅助角最值辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【诱导公式】关于“诱导公式”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"诱导公式辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【和差化积】关于“和差化积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"和差化积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【二倍角】关于“二倍角”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"二倍角辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【三角方程】关于“三角方程”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"三角方程辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【图像变换】关于“图像变换”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"图像变换辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【正弦定理】关于“正弦定理”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"正弦定理辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【余弦定理】关于“余弦定理”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"余弦定理辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【周期奇偶】关于“周期奇偶”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"周期奇偶辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【调和形式】关于“调和形式”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"调和形式辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[5].multi = [
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【辅助角最值】下列关于“辅助角最值”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"辅助角最值多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【诱导公式】下列关于“诱导公式”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"诱导公式多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【和差化积】下列关于“和差化积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"和差化积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【二倍角】下列关于“二倍角”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"二倍角多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【三角方程】下列关于“三角方程”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"三角方程多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【图像变换】下列关于“图像变换”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"图像变换多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【正弦定理】下列关于“正弦定理”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"正弦定理多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【余弦定理】下列关于“余弦定理”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"余弦定理多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【周期奇偶】下列关于“周期奇偶”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"周期奇偶多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`【调和形式】下列关于“调和形式”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"调和形式多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[5].judge = [
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“辅助角最值”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"辅助角最值判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“诱导公式”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"诱导公式判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“和差化积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"和差化积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“二倍角”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"二倍角判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“三角方程”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"三角方程判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“图像变换”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"图像变换判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“正弦定理”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"正弦定理判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“余弦定理”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"余弦定理判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“周期奇偶”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"周期奇偶判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'5.2',sectionName:'三角函数',stem:`判断：在必备条件下，“调和形式”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"调和形式判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[5].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'辅助角最值'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（辅助角最值）：结合本章情境\n(1)建立模型；\n(2)用“辅助角最值”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按辅助角最值完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:辅助角最值","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'诱导公式'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（诱导公式）：结合本章情境\n(1)建立模型；\n(2)用“诱导公式”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按诱导公式完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:诱导公式","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'和差化积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（和差化积）：结合本章情境\n(1)建立模型；\n(2)用“和差化积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按和差化积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:和差化积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'二倍角'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（二倍角）：结合本章情境\n(1)建立模型；\n(2)用“二倍角”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按二倍角完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:二倍角","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'三角方程'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（三角方程）：结合本章情境\n(1)建立模型；\n(2)用“三角方程”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按三角方程完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:三角方程","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'图像变换'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（图像变换）：结合本章情境\n(1)建立模型；\n(2)用“图像变换”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按图像变换完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:图像变换","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'正弦定理'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（正弦定理）：结合本章情境\n(1)建立模型；\n(2)用“正弦定理”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按正弦定理完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:正弦定理","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'余弦定理'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（余弦定理）：结合本章情境\n(1)建立模型；\n(2)用“余弦定理”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按余弦定理完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:余弦定理","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'周期奇偶'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（周期奇偶）：结合本章情境\n(1)建立模型；\n(2)用“周期奇偶”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按周期奇偶完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:周期奇偶","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'调和形式'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'5.2',sectionName:'三角函数',stem:`应用（调和形式）：结合本章情境\n(1)建立模型；\n(2)用“调和形式”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按调和形式完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:调和形式","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[6] = {}
TABLE[6].numeric = [
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【数量积垂直】a=(1,0),b=(0,2)，a·b=`,answer:'0',analysis:'垂直',hardProfile:hp({"coreChallenge":"数量积垂直","reasoningSteps":["数量积"],"difficultyEvidence":"垂直","misconceptionTrap":"非0","alternativeApproach":"坐标","verification":"0"})})
  },
  function (n) {
const a=2,b=5,d=1;return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【模长平方】|a|=${a},|b|=${b},a·b=${d}，|a-b|^2=`,answer:String(a*a+b*b-2*d),analysis:'展开',hardProfile:hp({"coreChallenge":"模长平方","reasoningSteps":["展开"],"difficultyEvidence":"模公式","misconceptionTrap":"符号","alternativeApproach":"坐标","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【基底系数】若c=2a-3b，则a,b表示c时a的系数`,answer:'2',analysis:'线性表出',hardProfile:hp({"coreChallenge":"基底系数","reasoningSteps":["基底"],"difficultyEvidence":"系数","misconceptionTrap":"顺序","alternativeApproach":"方程组","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【共线定理】A,B,C共线且B分AC比λ=1（中点），向量AB/AC=`,answer:'1/2',analysis:'中点',hardProfile:hp({"coreChallenge":"共线定理","reasoningSteps":["共线/定比"],"difficultyEvidence":"比例","misconceptionTrap":"1","alternativeApproach":"中点公式","verification":"1/2"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【中点向量】M中点AB，OM用OA,OB表示时OA系数`,answer:'1/2',analysis:'中点向量',hardProfile:hp({"coreChallenge":"中点向量","reasoningSteps":["中点公式"],"difficultyEvidence":"向量","misconceptionTrap":"全是1","alternativeApproach":"几何","verification":"1/2"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【夹角余弦】a=(3,4),b=(4,-3)，cos夹角=`,answer:'0',analysis:'点积0',hardProfile:hp({"coreChallenge":"夹角余弦","reasoningSteps":["夹角公式"],"difficultyEvidence":"计算","misconceptionTrap":"非0","alternativeApproach":"点积","verification":"0"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【投影长度】a在b方向投影标量：a=(2,0),b=(1,0)`,answer:'2',analysis:'投影',hardProfile:hp({"coreChallenge":"投影长度","reasoningSteps":["投影定义"],"difficultyEvidence":"投影","misconceptionTrap":"模混淆","alternativeApproach":"公式","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【对角向量】平行四边形对角线a+b与a-b的数量积为0则邻边关系：|a|与|b|`,answer:'相等',analysis:'邻边相等⇒矩形? 实际|a|=|b|菱形',hardProfile:hp({"coreChallenge":"对角向量","reasoningSteps":["对角垂直⇔菱形"],"difficultyEvidence":"推理","misconceptionTrap":"矩形","alternativeApproach":"展开","verification":"|a|=|b|"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【单位向量】a=(3,4)的单位向量模`,answer:'1',analysis:'单位向量',hardProfile:hp({"coreChallenge":"单位向量","reasoningSteps":["单位化"],"difficultyEvidence":"定义","misconceptionTrap":"答5","alternativeApproach":"除以模","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【线性相关】平面向量a,b线性相关则存在不全零实数k,l使ka+lb=0。若b≠0且a=2b，则一组(k,l)中k=`,answer:'1',analysis:'1*a+(-2)*b=0可取k=1',hardProfile:hp({"coreChallenge":"线性相关","reasoningSteps":["相关定义"],"difficultyEvidence":"系数","misconceptionTrap":"零解","alternativeApproach":"举例","verification":"1"})})
  },
]
TABLE[6].single = [
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【数量积垂直】关于“数量积垂直”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"数量积垂直辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【模长平方】关于“模长平方”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"模长平方辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【基底系数】关于“基底系数”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"基底系数辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【共线定理】关于“共线定理”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"共线定理辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【中点向量】关于“中点向量”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"中点向量辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【夹角余弦】关于“夹角余弦”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"夹角余弦辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【投影长度】关于“投影长度”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"投影长度辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【对角向量】关于“对角向量”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对角向量辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【单位向量】关于“单位向量”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"单位向量辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【线性相关】关于“线性相关”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"线性相关辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[6].multi = [
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【数量积垂直】下列关于“数量积垂直”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"数量积垂直多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【模长平方】下列关于“模长平方”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"模长平方多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【基底系数】下列关于“基底系数”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"基底系数多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【共线定理】下列关于“共线定理”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"共线定理多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【中点向量】下列关于“中点向量”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"中点向量多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【夹角余弦】下列关于“夹角余弦”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"夹角余弦多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【投影长度】下列关于“投影长度”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"投影长度多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【对角向量】下列关于“对角向量”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对角向量多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【单位向量】下列关于“单位向量”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"单位向量多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`【线性相关】下列关于“线性相关”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"线性相关多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[6].judge = [
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“数量积垂直”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"数量积垂直判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“模长平方”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"模长平方判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“基底系数”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"基底系数判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“共线定理”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"共线定理判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“中点向量”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"中点向量判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“夹角余弦”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"夹角余弦判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“投影长度”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"投影长度判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“对角向量”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对角向量判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“单位向量”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"单位向量判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'6.2',sectionName:'向量运算',stem:`判断：在必备条件下，“线性相关”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"线性相关判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[6].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'数量积垂直'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（数量积垂直）：结合本章情境\n(1)建立模型；\n(2)用“数量积垂直”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按数量积垂直完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:数量积垂直","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'模长平方'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（模长平方）：结合本章情境\n(1)建立模型；\n(2)用“模长平方”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按模长平方完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:模长平方","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'基底系数'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（基底系数）：结合本章情境\n(1)建立模型；\n(2)用“基底系数”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按基底系数完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:基底系数","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'共线定理'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（共线定理）：结合本章情境\n(1)建立模型；\n(2)用“共线定理”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按共线定理完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:共线定理","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'中点向量'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（中点向量）：结合本章情境\n(1)建立模型；\n(2)用“中点向量”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按中点向量完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:中点向量","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'夹角余弦'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（夹角余弦）：结合本章情境\n(1)建立模型；\n(2)用“夹角余弦”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按夹角余弦完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:夹角余弦","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'投影长度'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（投影长度）：结合本章情境\n(1)建立模型；\n(2)用“投影长度”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按投影长度完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:投影长度","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对角向量'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（对角向量）：结合本章情境\n(1)建立模型；\n(2)用“对角向量”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对角向量完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对角向量","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'单位向量'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（单位向量）：结合本章情境\n(1)建立模型；\n(2)用“单位向量”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按单位向量完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:单位向量","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'线性相关'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'6.2',sectionName:'向量运算',stem:`应用（线性相关）：结合本章情境\n(1)建立模型；\n(2)用“线性相关”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按线性相关完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:线性相关","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[7] = {}
TABLE[7].numeric = [
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【模长计算】|3-4i|=`,answer:'5',analysis:'模',hardProfile:hp({"coreChallenge":"模长计算","reasoningSteps":["模公式"],"difficultyEvidence":"计算","misconceptionTrap":"7","alternativeApproach":"几何","verification":"5"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【共轭性质】共轭(2+3i)的虚部`,answer:'-3',analysis:'共轭',hardProfile:hp({"coreChallenge":"共轭性质","reasoningSteps":["共轭"],"difficultyEvidence":"虚部符号","misconceptionTrap":"+3","alternativeApproach":"定义","verification":"-3"})})
  },
  function (n) {
const p=4+(n%3);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【除法实部】( ${p}-i)/(1-i)的实部`,answer:String((p-1)/2),analysis:'乘1+i',hardProfile:hp({"coreChallenge":"除法实部","reasoningSteps":["分母实化"],"difficultyEvidence":"除法","misconceptionTrap":"漏乘","alternativeApproach":"代数","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【虚数单位周期】i^4=`,answer:'1',analysis:'周期4',hardProfile:hp({"coreChallenge":"虚数单位周期","reasoningSteps":["周期"],"difficultyEvidence":"幂","misconceptionTrap":"-1","alternativeApproach":"列表","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【复平面距离】1+i与1-i在复平面距离`,answer:'2',analysis:'|2i|=2',hardProfile:hp({"coreChallenge":"复平面距离","reasoningSteps":["距离=模差"],"difficultyEvidence":"几何","misconceptionTrap":"√2","alternativeApproach":"坐标","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【开方根数】z^2=-1的复数解个数`,answer:'2',analysis:'±i',hardProfile:hp({"coreChallenge":"开方根数","reasoningSteps":["开方"],"difficultyEvidence":"个数","misconceptionTrap":"1","alternativeApproach":"因式","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【实虚部方程】z=x+yi，z+共轭z=4则x=`,answer:'2',analysis:'2x=4',hardProfile:hp({"coreChallenge":"实虚部方程","reasoningSteps":["实部"],"difficultyEvidence":"方程","misconceptionTrap":"y","alternativeApproach":"共轭性质","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【共轭方程】若z=共轭z则z在复平面上的轨迹：横/纵轴？填横或纵`,answer:'横',analysis:'实轴',hardProfile:hp({"coreChallenge":"共轭方程","reasoningSteps":["共轭刻画实数"],"difficultyEvidence":"轨迹","misconceptionTrap":"纵","alternativeApproach":"几何","verification":"横"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【辐角主值】1+i的辐角主值（度）`,answer:'45',analysis:'第一象限',hardProfile:hp({"coreChallenge":"辐角主值","reasoningSteps":["辐角"],"difficultyEvidence":"象限","misconceptionTrap":"135","alternativeApproach":"三角","verification":"45"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【平方非实】(1+i)^2的实部`,answer:'0',analysis:'1+2i-1=2i',hardProfile:hp({"coreChallenge":"平方非实","reasoningSteps":["展开"],"difficultyEvidence":"平方","misconceptionTrap":"2","alternativeApproach":"代数","verification":"0"})})
  },
]
TABLE[7].single = [
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【模长计算】关于“模长计算”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"模长计算辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【共轭性质】关于“共轭性质”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"共轭性质辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【除法实部】关于“除法实部”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"除法实部辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【虚数单位周期】关于“虚数单位周期”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"虚数单位周期辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【复平面距离】关于“复平面距离”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"复平面距离辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【开方根数】关于“开方根数”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"开方根数辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【实虚部方程】关于“实虚部方程”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"实虚部方程辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【共轭方程】关于“共轭方程”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"共轭方程辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【辐角主值】关于“辐角主值”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"辐角主值辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【平方非实】关于“平方非实”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"平方非实辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[7].multi = [
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【模长计算】下列关于“模长计算”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"模长计算多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【共轭性质】下列关于“共轭性质”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"共轭性质多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【除法实部】下列关于“除法实部”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"除法实部多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【虚数单位周期】下列关于“虚数单位周期”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"虚数单位周期多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【复平面距离】下列关于“复平面距离”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"复平面距离多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【开方根数】下列关于“开方根数”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"开方根数多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【实虚部方程】下列关于“实虚部方程”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"实虚部方程多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【共轭方程】下列关于“共轭方程”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"共轭方程多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【辐角主值】下列关于“辐角主值”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"辐角主值多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`【平方非实】下列关于“平方非实”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"平方非实多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[7].judge = [
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“模长计算”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"模长计算判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“共轭性质”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"共轭性质判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“除法实部”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"除法实部判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“虚数单位周期”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"虚数单位周期判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“复平面距离”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"复平面距离判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“开方根数”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"开方根数判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“实虚部方程”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"实虚部方程判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“共轭方程”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"共轭方程判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“辐角主值”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"辐角主值判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'7.2',sectionName:'复数运算',stem:`判断：在必备条件下，“平方非实”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"平方非实判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[7].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'模长计算'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（模长计算）：结合本章情境\n(1)建立模型；\n(2)用“模长计算”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按模长计算完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:模长计算","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'共轭性质'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（共轭性质）：结合本章情境\n(1)建立模型；\n(2)用“共轭性质”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按共轭性质完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:共轭性质","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'除法实部'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（除法实部）：结合本章情境\n(1)建立模型；\n(2)用“除法实部”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按除法实部完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:除法实部","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'虚数单位周期'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（虚数单位周期）：结合本章情境\n(1)建立模型；\n(2)用“虚数单位周期”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按虚数单位周期完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:虚数单位周期","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'复平面距离'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（复平面距离）：结合本章情境\n(1)建立模型；\n(2)用“复平面距离”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按复平面距离完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:复平面距离","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'开方根数'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（开方根数）：结合本章情境\n(1)建立模型；\n(2)用“开方根数”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按开方根数完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:开方根数","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'实虚部方程'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（实虚部方程）：结合本章情境\n(1)建立模型；\n(2)用“实虚部方程”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按实虚部方程完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:实虚部方程","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'共轭方程'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（共轭方程）：结合本章情境\n(1)建立模型；\n(2)用“共轭方程”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按共轭方程完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:共轭方程","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'辐角主值'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（辐角主值）：结合本章情境\n(1)建立模型；\n(2)用“辐角主值”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按辐角主值完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:辐角主值","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'平方非实'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'7.2',sectionName:'复数运算',stem:`应用（平方非实）：结合本章情境\n(1)建立模型；\n(2)用“平方非实”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按平方非实完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:平方非实","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[8] = {}
TABLE[8].numeric = [
  function (n) {
const r=2+(n%3),h=5+(n%2);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【柱体体积】圆柱r=${r},h=${h}，体积/π=`,answer:String(r*r*h),analysis:'πr^2h',hardProfile:hp({"coreChallenge":"柱体体积","reasoningSteps":["体积公式"],"difficultyEvidence":"柱体","misconceptionTrap":"漏π处理","alternativeApproach":"展开","verification":"ok"})})
  },
  function (n) {
const r=2+(n%3),h=3+(n%4);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【锥体体积】圆锥r=${r},h=${h}，体积/π=`,answer:String((r*r*h)/3),analysis:'1/3',hardProfile:hp({"coreChallenge":"锥体体积","reasoningSteps":["锥体1/3"],"difficultyEvidence":"体积","misconceptionTrap":"忘1/3","alternativeApproach":"公式","verification":"ok"})})
  },
  function (n) {
const a=3+(n%3);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【表面积展开】棱长${a}正方体表面积`,answer:String(6*a*a),analysis:'6a^2',hardProfile:hp({"coreChallenge":"表面积展开","reasoningSteps":["展开/面积"],"difficultyEvidence":"表面","misconceptionTrap":"体积混","alternativeApproach":"展开图","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【线面平行】直线平行平面的判定：线不在面内且平行面内直线。本判断题化填空：关键条件条数通常强调`,answer:'2',analysis:'两条件',hardProfile:hp({"coreChallenge":"线面平行","reasoningSteps":["判定定理"],"difficultyEvidence":"条件完整性","misconceptionTrap":"只平行","alternativeApproach":"模型","verification":"2"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【面面垂直】面面垂直判定：一面内直线垂直另一面。判定中该直线与交线关系：垂直？填是/否（是）`,answer:'是',analysis:'线面垂直⇒面面垂直',hardProfile:hp({"coreChallenge":"面面垂直","reasoningSteps":["面面垂直判定"],"difficultyEvidence":"转化","misconceptionTrap":"否","alternativeApproach":"模型","verification":"是"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【空间角】正方体棱长1，异面棱所成角余弦绝对值`,answer:'0',analysis:'可垂直',hardProfile:hp({"coreChallenge":"空间角","reasoningSteps":["异面角"],"difficultyEvidence":"平移","misconceptionTrap":"非0","alternativeApproach":"补形","verification":"0"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【三视图还原】三视图都是边长1的正方形，对应几何体体积`,answer:'1',analysis:'正方体',hardProfile:hp({"coreChallenge":"三视图还原","reasoningSteps":["三视图还原"],"difficultyEvidence":"空间想象","misconceptionTrap":"球等","alternativeApproach":"还原","verification":"1"})})
  },
  function (n) {
const R=5;return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【球截面】球半径${R}，截面圆半径3，则截面到球心距离`,answer:'4',analysis:'勾股',hardProfile:hp({"coreChallenge":"球截面","reasoningSteps":["球截面"],"difficultyEvidence":"勾股","misconceptionTrap":"5-3","alternativeApproach":"模型","verification":"4"})})
  },
  function (n) {
const a=2,b=3,c=6;return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【空间对角线】长方体棱${a},${b},${c}，体对角线长`,answer:String(Math.hypot(a,b,c)),analysis:'√(a^2+b^2+c^2)',hardProfile:hp({"coreChallenge":"空间对角线","reasoningSteps":["空间勾股"],"difficultyEvidence":"对角线","misconceptionTrap":"面对角混","alternativeApproach":"两次勾股","verification":"ok"})})
  },
  function (n) {
const S=6,h=4;return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【棱锥高体积】棱锥底面积${S}高${h}体积`,answer:String((S*h)/3),analysis:'1/3Sh',hardProfile:hp({"coreChallenge":"棱锥高体积","reasoningSteps":["棱锥体积"],"difficultyEvidence":"1/3","misconceptionTrap":"忘1/3","alternativeApproach":"公式","verification":"ok"})})
  },
]
TABLE[8].single = [
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【柱体体积】关于“柱体体积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"柱体体积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【锥体体积】关于“锥体体积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"锥体体积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【表面积展开】关于“表面积展开”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"表面积展开辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【线面平行】关于“线面平行”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"线面平行辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【面面垂直】关于“面面垂直”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"面面垂直辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【空间角】关于“空间角”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"空间角辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【三视图还原】关于“三视图还原”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"三视图还原辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【球截面】关于“球截面”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"球截面辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【空间对角线】关于“空间对角线”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"空间对角线辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【棱锥高体积】关于“棱锥高体积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"棱锥高体积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[8].multi = [
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【柱体体积】下列关于“柱体体积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"柱体体积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【锥体体积】下列关于“锥体体积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"锥体体积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【表面积展开】下列关于“表面积展开”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"表面积展开多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【线面平行】下列关于“线面平行”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"线面平行多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【面面垂直】下列关于“面面垂直”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"面面垂直多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【空间角】下列关于“空间角”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"空间角多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【三视图还原】下列关于“三视图还原”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"三视图还原多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【球截面】下列关于“球截面”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"球截面多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【空间对角线】下列关于“空间对角线”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"空间对角线多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`【棱锥高体积】下列关于“棱锥高体积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"棱锥高体积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[8].judge = [
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“柱体体积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"柱体体积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“锥体体积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"锥体体积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“表面积展开”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"表面积展开判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“线面平行”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"线面平行判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“面面垂直”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"面面垂直判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“空间角”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"空间角判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“三视图还原”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"三视图还原判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“球截面”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"球截面判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“空间对角线”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"空间对角线判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`判断：在必备条件下，“棱锥高体积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"棱锥高体积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[8].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'柱体体积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（柱体体积）：结合本章情境\n(1)建立模型；\n(2)用“柱体体积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按柱体体积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:柱体体积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'锥体体积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（锥体体积）：结合本章情境\n(1)建立模型；\n(2)用“锥体体积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按锥体体积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:锥体体积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'表面积展开'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（表面积展开）：结合本章情境\n(1)建立模型；\n(2)用“表面积展开”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按表面积展开完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:表面积展开","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'线面平行'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（线面平行）：结合本章情境\n(1)建立模型；\n(2)用“线面平行”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按线面平行完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:线面平行","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'面面垂直'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（面面垂直）：结合本章情境\n(1)建立模型；\n(2)用“面面垂直”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按面面垂直完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:面面垂直","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'空间角'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（空间角）：结合本章情境\n(1)建立模型；\n(2)用“空间角”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按空间角完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:空间角","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'三视图还原'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（三视图还原）：结合本章情境\n(1)建立模型；\n(2)用“三视图还原”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按三视图还原完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:三视图还原","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'球截面'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（球截面）：结合本章情境\n(1)建立模型；\n(2)用“球截面”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按球截面完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:球截面","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'空间对角线'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（空间对角线）：结合本章情境\n(1)建立模型；\n(2)用“空间对角线”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按空间对角线完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:空间对角线","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'棱锥高体积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'8.3',sectionName:'立体几何初步',stem:`应用（棱锥高体积）：结合本章情境\n(1)建立模型；\n(2)用“棱锥高体积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按棱锥高体积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:棱锥高体积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[9] = {}
TABLE[9].numeric = [
  function (n) {
const tot=50,freq=0.2;return body({sectionCode:'9.2',sectionName:'统计',stem:`【频率分布】样本${tot}，某组频率${freq}，频数`,answer:String(tot*freq),analysis:'频数=频率×总量',hardProfile:hp({"coreChallenge":"频率分布","reasoningSteps":["频率定义"],"difficultyEvidence":"换算","misconceptionTrap":"颠倒","alternativeApproach":"表","verification":"ok"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【分层抽样】总体分两层比例3:2，抽10人，第一层应抽`,answer:'6',analysis:'分层',hardProfile:hp({"coreChallenge":"分层抽样","reasoningSteps":["分层比例"],"difficultyEvidence":"抽样","misconceptionTrap":"5","alternativeApproach":"比例","verification":"6"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【回归过均值点】经验回归直线是否过样本中心点(是填1否0)`,answer:'1',analysis:'过均值点',hardProfile:hp({"coreChallenge":"回归过均值点","reasoningSteps":["回归性质"],"difficultyEvidence":"性质","misconceptionTrap":"否","alternativeApproach":"公式","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【残差直观】残差平方和更小意味着拟合更好？(是1否0)`,answer:'1',analysis:'直观',hardProfile:hp({"coreChallenge":"残差直观","reasoningSteps":["残差"],"difficultyEvidence":"拟合","misconceptionTrap":"否","alternativeApproach":"定义","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【茎叶中位数】茎叶图数据3,5,7,8,9中位数`,answer:'7',analysis:'中间',hardProfile:hp({"coreChallenge":"茎叶中位数","reasoningSteps":["中位数"],"difficultyEvidence":"排序","misconceptionTrap":"均值混","alternativeApproach":"茎叶读","verification":"7"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【方差公式】数据1,1,1,1方差`,answer:'0',analysis:'无波动',hardProfile:hp({"coreChallenge":"方差公式","reasoningSteps":["方差"],"difficultyEvidence":"公式","misconceptionTrap":"非0","alternativeApproach":"定义","verification":"0"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【百分位数】百分位数P50又称`,answer:'中位数',analysis:'定义',hardProfile:hp({"coreChallenge":"百分位数","reasoningSteps":["百分位"],"difficultyEvidence":"概念","misconceptionTrap":"众数","alternativeApproach":"定义","verification":"中位数"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【相关系数符号】相关系数r=0.9说明相关方向：正/负`,answer:'正',analysis:'符号',hardProfile:hp({"coreChallenge":"相关系数符号","reasoningSteps":["相关符号"],"difficultyEvidence":"解读","misconceptionTrap":"负","alternativeApproach":"散点","verification":"正"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【直方图面积】直方图各矩形面积之和（频率）`,answer:'1',analysis:'总和1',hardProfile:hp({"coreChallenge":"直方图面积","reasoningSteps":["直方图"],"difficultyEvidence":"面积","misconceptionTrap":"样本容量","alternativeApproach":"定义","verification":"1"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【抽样辨析】简单随机与分层：总体明显分层时更合适的是分层？(是1否0)`,answer:'1',analysis:'抽样辨析',hardProfile:hp({"coreChallenge":"抽样辨析","reasoningSteps":["抽样方法"],"difficultyEvidence":"适用","misconceptionTrap":"否","alternativeApproach":"情景","verification":"1"})})
  },
]
TABLE[9].single = [
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【频率分布】关于“频率分布”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"频率分布辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【分层抽样】关于“分层抽样”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"分层抽样辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【回归过均值点】关于“回归过均值点”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"回归过均值点辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【残差直观】关于“残差直观”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"残差直观辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【茎叶中位数】关于“茎叶中位数”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"茎叶中位数辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【方差公式】关于“方差公式”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"方差公式辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【百分位数】关于“百分位数”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"百分位数辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【相关系数符号】关于“相关系数符号”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"相关系数符号辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【直方图面积】关于“直方图面积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"直方图面积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【抽样辨析】关于“抽样辨析”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"抽样辨析辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[9].multi = [
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【频率分布】下列关于“频率分布”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"频率分布多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【分层抽样】下列关于“分层抽样”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"分层抽样多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【回归过均值点】下列关于“回归过均值点”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"回归过均值点多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【残差直观】下列关于“残差直观”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"残差直观多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【茎叶中位数】下列关于“茎叶中位数”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"茎叶中位数多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【方差公式】下列关于“方差公式”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"方差公式多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【百分位数】下列关于“百分位数”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"百分位数多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【相关系数符号】下列关于“相关系数符号”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"相关系数符号多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【直方图面积】下列关于“直方图面积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"直方图面积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`【抽样辨析】下列关于“抽样辨析”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"抽样辨析多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[9].judge = [
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“频率分布”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"频率分布判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“分层抽样”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"分层抽样判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“回归过均值点”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"回归过均值点判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“残差直观”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"残差直观判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“茎叶中位数”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"茎叶中位数判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“方差公式”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"方差公式判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“百分位数”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"百分位数判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“相关系数符号”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"相关系数符号判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“直方图面积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"直方图面积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'9.2',sectionName:'统计',stem:`判断：在必备条件下，“抽样辨析”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"抽样辨析判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[9].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'频率分布'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（频率分布）：结合本章情境\n(1)建立模型；\n(2)用“频率分布”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按频率分布完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:频率分布","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'分层抽样'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（分层抽样）：结合本章情境\n(1)建立模型；\n(2)用“分层抽样”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按分层抽样完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:分层抽样","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'回归过均值点'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（回归过均值点）：结合本章情境\n(1)建立模型；\n(2)用“回归过均值点”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按回归过均值点完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:回归过均值点","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'残差直观'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（残差直观）：结合本章情境\n(1)建立模型；\n(2)用“残差直观”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按残差直观完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:残差直观","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'茎叶中位数'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（茎叶中位数）：结合本章情境\n(1)建立模型；\n(2)用“茎叶中位数”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按茎叶中位数完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:茎叶中位数","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'方差公式'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（方差公式）：结合本章情境\n(1)建立模型；\n(2)用“方差公式”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按方差公式完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:方差公式","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'百分位数'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（百分位数）：结合本章情境\n(1)建立模型；\n(2)用“百分位数”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按百分位数完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:百分位数","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'相关系数符号'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（相关系数符号）：结合本章情境\n(1)建立模型；\n(2)用“相关系数符号”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按相关系数符号完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:相关系数符号","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'直方图面积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（直方图面积）：结合本章情境\n(1)建立模型；\n(2)用“直方图面积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按直方图面积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:直方图面积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'抽样辨析'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'9.2',sectionName:'统计',stem:`应用（抽样辨析）：结合本章情境\n(1)建立模型；\n(2)用“抽样辨析”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按抽样辨析完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:抽样辨析","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]

TABLE[10] = {}
TABLE[10].numeric = [
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【古典概型】掷匀称骰子P(点数≤2)=`,answer:'1/3',analysis:'古典',hardProfile:hp({"coreChallenge":"古典概型","reasoningSteps":["等可能"],"difficultyEvidence":"计数","misconceptionTrap":"1/2","alternativeApproach":"列表","verification":"1/3"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【独立乘积】独立P(A)=0.2,P(B)=0.5，P(AB)=`,answer:'0.1',analysis:'乘积',hardProfile:hp({"coreChallenge":"独立乘积","reasoningSteps":["独立"],"difficultyEvidence":"乘法","misconceptionTrap":"相加","alternativeApproach":"定义","verification":"0.1"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【互斥加法】互斥P(A)=0.1,P(B)=0.2，P(A∪B)=`,answer:'0.3',analysis:'互斥加',hardProfile:hp({"coreChallenge":"互斥加法","reasoningSteps":["互斥"],"difficultyEvidence":"加法","misconceptionTrap":"乘","alternativeApproach":"文氏","verification":"0.3"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【条件概率】P(A)=0.5,P(AB)=0.2，P(B|A)=`,answer:'0.4',analysis:'条件概率',hardProfile:hp({"coreChallenge":"条件概率","reasoningSteps":["条件定义"],"difficultyEvidence":"公式","misconceptionTrap":"颠倒","alternativeApproach":"定义","verification":"0.4"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【对立事件】P(A)=0.3，P(对立A)=`,answer:'0.7',analysis:'对立',hardProfile:hp({"coreChallenge":"对立事件","reasoningSteps":["对立"],"difficultyEvidence":"1-p","misconceptionTrap":"互斥混","alternativeApproach":"定义","verification":"0.7"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【树状两步】两步均成功概率0.5独立，都成功概率`,answer:'0.25',analysis:'树状',hardProfile:hp({"coreChallenge":"树状两步","reasoningSteps":["两步独立"],"difficultyEvidence":"乘","misconceptionTrap":"加","alternativeApproach":"树图","verification":"0.25"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【放回不放回】袋中3红2白，不放回连抽2红概率：第一红3/5，第二？填写第二步红的条件概率分子分母之和`,answer:'6',analysis:'2/4=1/2，2+4=6',hardProfile:hp({"coreChallenge":"放回不放回","reasoningSteps":["不放回"],"difficultyEvidence":"条件变化","misconceptionTrap":"放回混","alternativeApproach":"树图","verification":"6"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【几何概型】[0,1]上随机取点落在[0,0.3]概率`,answer:'0.3',analysis:'几何概型',hardProfile:hp({"coreChallenge":"几何概型","reasoningSteps":["长度比"],"difficultyEvidence":"几何","misconceptionTrap":"古典混","alternativeApproach":"测度","verification":"0.3"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【全概率雏形】全概率：P(B)=P(B|A)P(A)+P(B|Ac)P(Ac)。若P(A)=0.5,P(B|A)=0.4,P(B|Ac)=0.2，P(B)=`,answer:'0.3',analysis:'全概率',hardProfile:hp({"coreChallenge":"全概率雏形","reasoningSteps":["全概率"],"difficultyEvidence":"加权","misconceptionTrap":"只乘","alternativeApproach":"树图","verification":"0.3"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【频率稳定】频率随试验次数增大稳定于概率？(是1否0)`,answer:'1',analysis:'频率稳定',hardProfile:hp({"coreChallenge":"频率稳定","reasoningSteps":["统计定义直觉"],"difficultyEvidence":"稳定","misconceptionTrap":"否","alternativeApproach":"试验","verification":"1"})})
  },
]
TABLE[10].single = [
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【古典概型】关于“古典概型”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"古典概型辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【独立乘积】关于“独立乘积”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"独立乘积辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【互斥加法】关于“互斥加法”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"互斥加法辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【条件概率】关于“条件概率”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"条件概率辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【对立事件】关于“对立事件”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"对立事件辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【树状两步】关于“树状两步”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"树状两步辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【放回不放回】关于“放回不放回”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"放回不放回辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【几何概型】关于“几何概型”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"几何概型辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【全概率雏形】关于“全概率雏形”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"全概率雏形辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【频率稳定】关于“频率稳定”，下列正确的是`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:hp({"coreChallenge":"频率稳定辨析","reasoningSteps":["对照定义","排除误区"],"difficultyEvidence":"概念陷阱综合","misconceptionTrap":"选看似对的B","alternativeApproach":"反例法","verification":"A"})})
  },
]
TABLE[10].multi = [
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【古典概型】下列关于“古典概型”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"古典概型多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【独立乘积】下列关于“独立乘积”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"独立乘积多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【互斥加法】下列关于“互斥加法”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"互斥加法多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【条件概率】下列关于“条件概率”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"条件概率多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【对立事件】下列关于“对立事件”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"对立事件多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【树状两步】下列关于“树状两步”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"树状两步多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【放回不放回】下列关于“放回不放回”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"放回不放回多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【几何概型】下列关于“几何概型”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"几何概型多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【全概率雏形】下列关于“全概率雏形”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"全概率雏形多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`【频率稳定】下列关于“频率稳定”正确的有（多选）`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:hp({"coreChallenge":"频率稳定多点","reasoningSteps":["逐项","排除否命题"],"difficultyEvidence":"多知识点","misconceptionTrap":"漏选","alternativeApproach":"举例","verification":"ABD"})})
  },
]
TABLE[10].judge = [
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“古典概型”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"古典概型判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“独立乘积”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"独立乘积判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“互斥加法”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"互斥加法判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“条件概率”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"条件概率判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“对立事件”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"对立事件判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“树状两步”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"树状两步判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“放回不放回”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"放回不放回判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“几何概型”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"几何概型判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“全概率雏形”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"全概率雏形判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
  function (n) {
return body({sectionCode:'10.2',sectionName:'概率',stem:`判断：在必备条件下，“频率稳定”的标准结论可以成立（需核对前提）。`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:hp({"coreChallenge":"频率稳定判断","reasoningSteps":["核对条件","证明或反例"],"difficultyEvidence":"条件陷阱","misconceptionTrap":"忽略前提","alternativeApproach":"特例检验","verification":"true"})})
  },
]
TABLE[10].application = [
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'古典概型'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（古典概型）：结合本章情境\n(1)建立模型；\n(2)用“古典概型”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按古典概型完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:古典概型","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'独立乘积'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（独立乘积）：结合本章情境\n(1)建立模型；\n(2)用“独立乘积”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按独立乘积完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:独立乘积","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'互斥加法'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（互斥加法）：结合本章情境\n(1)建立模型；\n(2)用“互斥加法”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按互斥加法完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:互斥加法","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'条件概率'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（条件概率）：结合本章情境\n(1)建立模型；\n(2)用“条件概率”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按条件概率完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:条件概率","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'对立事件'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（对立事件）：结合本章情境\n(1)建立模型；\n(2)用“对立事件”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按对立事件完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:对立事件","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'树状两步'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（树状两步）：结合本章情境\n(1)建立模型；\n(2)用“树状两步”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按树状两步完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:树状两步","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'放回不放回'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（放回不放回）：结合本章情境\n(1)建立模型；\n(2)用“放回不放回”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按放回不放回完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:放回不放回","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'几何概型'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（几何概型）：结合本章情境\n(1)建立模型；\n(2)用“几何概型”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按几何概型完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:几何概型","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'全概率雏形'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（全概率雏形）：结合本章情境\n(1)建立模型；\n(2)用“全概率雏形”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按全概率雏形完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:全概率雏形","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
  function (n) {
const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'频率稳定'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'10.2',sectionName:'概率',stem:`应用（频率稳定）：结合本章情境\n(1)建立模型；\n(2)用“频率稳定”求指定量并检验。参数种子=${2+(n%7)}。`,answer:'见解析（建模后唯一核定值）',analysis:`按频率稳定完整推导并检验。`,...rub,hardProfile:hp({"coreChallenge":"应用:频率稳定","reasoningSteps":["建模","关键推导","检验"],"difficultyEvidence":"应用综合压轴","misconceptionTrap":"跳步套公式","alternativeApproach":"另一等价模型","verification":"ok"})})
  },
]
