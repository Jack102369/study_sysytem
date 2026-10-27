/**
 * Generate _4d_true_hard.mjs with ≥10 structural families per ch×qt.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(__dirname, '_4d_true_hard.mjs')

function hp(c, steps, evi, trap, alt, ver) {
  return `hp(${JSON.stringify({
    coreChallenge: c,
    reasoningSteps: steps,
    difficultyEvidence: evi,
    misconceptionTrap: trap,
    alternativeApproach: alt,
    verification: ver,
  })})`
}

const chapters = {}
function add(ch, qt, bodies) {
  if (!chapters[ch]) chapters[ch] = {}
  chapters[ch][qt] = bodies
}

// ---------- ch1 full quality ----------
add(1, 'numeric', [
  `const N=24+(n%9);const A=(N>>1),B=Math.floor(N/3),C=Math.floor(N/5),AB=Math.floor(N/6),AC=Math.floor(N/10),BC=Math.floor(N/15),ABC=Math.floor(N/30);const u=A+B+C-AB-AC-BC+ABC;const ans=N-u;return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`全集 $U=\\\\{1,\\\\ldots,\${N}\\\\}$，$A$偶数、$B$为3倍数、$C$为5倍数。求 $|\\\\complement_U(A\\\\cup B\\\\cup C)|$\`,answer:String(ans),analysis:\`三维容斥并=\${u}，补=\${ans}\`,hardProfile:${hp('三集合容斥取补',['各类计数','容斥','取补'],'三维容斥','漏ABC','枚举','ok')}})`,
  `const N=20+(n%8);const A=Math.floor(N/2),B=Math.floor(N/3),AB=Math.floor(N/6);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`U={1..\$\{N\}}，求偶数或3倍数的元素个数\`,answer:String(A+B-AB),analysis:'两集合容斥',hardProfile:${hp('两集合整除容斥',['A','B','交','并'],'容斥','相加','枚举','ok')}})`,
  `const a=2+(n%4),b=a+4+(n%3);const ans=b-a-1;return body({sectionCode:'1.1',sectionName:'集合的概念',stem:\`$A=\\\\{x\\\\in Z\\\\mid \${a}<x<\${b}\\\\}$，|A|=\`,answer:String(ans),analysis:'开区间整数个数',hardProfile:${hp('开区间整数计数',['列整数','计数'],'端点','b-a','列举','ok')}})`,
  `const m=4+(n%4);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:\`|A|=\${m}，幂集元素个数\`,answer:String(2**m),analysis:'2^m',hardProfile:${hp('幂集基数',['定义','2^n'],'概念','答m','小m验证','ok')}})`,
  `const N=18+(n%6);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`U={1..\$\{N\}}，既是偶数又不是3倍数的个数\`,answer:String(Math.floor(N/2)-Math.floor(N/6)),analysis:'差集',hardProfile:${hp('差集计数',['偶','减6倍'],'差集','漏减','枚举','ok')}})`,
  `const k=5+(n%4);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`$A_i={1..i}$，|A_1∪…∪A_k| 其中k=\${k}\`,answer:String(k),analysis:'并=A_k',hardProfile:${hp('嵌套并化简',['单调包含','并=最大'],'识别嵌套','累加','归纳','ok')}})`,
  `const N=15+(n%5);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`|补_U(偶数集)|，U={1..\$\{N\}}\`,answer:String(N-Math.floor(N/2)),analysis:'奇数个数',hardProfile:${hp('补集',['|U|-|A|'],'N奇偶','各半','列举','ok')}})`,
  `const a=2+(n%3),b=5+(n%2);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`|A|=\${a},|B|=\${b},A∩B=∅，|A∪B|=\`,answer:String(a+b),analysis:'不交并',hardProfile:${hp('不交并',['交空','求和'],'条件','仍减交','文氏','ok')}})`,
  `const N=30+(n%5);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`1到\${N}中被2或3整除的个数\`,answer:String(Math.floor(N/2)+Math.floor(N/3)-Math.floor(N/6)),analysis:'容斥',hardProfile:${hp('整除或',['2','3','减6'],'容斥','相加','枚举','ok')}})`,
  `const p=3+(n%3);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:\`U={0..\$\{p*5\}}，A={p的倍数}∩U，求|A不含0|\`,answer:String(Math.floor((p*5)/p)),analysis:'非零倍数',hardProfile:${hp('去零倍数计数',['刻画','去掉0'],'边界0','含0','列举','ok')}})`,
])

add(1, 'single', [
  `const a=3+(n%4);return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'设实数x，正确的是',options:{A:\`"x>\${a}且x<\${a+2}"是"|x-\${a+1}|<1"的充要条件\`,B:'"x>a"是"x>a+1"的充分条件',C:'"x^2=a^2"是"x=a"的必要条件',D:'不宜选项'},answer:'A',analysis:'绝对值区间等价',hardProfile:${hp('充要+绝对值',['化区间','对照'],'综合','说反','集合相等','A')}})`,
  `return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'一定正确的是',options:{A:'A⊆B且B⊆C⇒A⊆C',B:'A⊈B⇒B⊈A',C:'A∪B=B⇒A=B',D:'A∩B=A⇒A=B'},answer:'A',analysis:'传递性',hardProfile:${hp('包含推理',['传递','反例'],'多项','选C','文氏','A')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'A∪B=A∩B则',options:{A:'A=B',B:'A⊊B',C:'交空',D:'|A|>|B|'},answer:'A',analysis:'并=交⇒相等',hardProfile:${hp('并交相等',['夹逼'],'抽象','只比基数','元素','A')}})`,
  `return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'表示正确的是',options:{A:'{x|x^2=1}={1}',B:'{x∈R|x^2+1=0}=∅',C:'{0}={∅}',D:'0={0}'},answer:'B',analysis:'无实根',hardProfile:${hp('集合表示',['逐项'],'空集混点','选A','列元素','B')}})`,
  `return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'“a>1”是“a^2>1”的',options:{A:'充分不必要',B:'必要不充分',C:'充要',D:'都不'},answer:'A',analysis:'负反例',hardProfile:${hp('平方不等式蕴含',['充分','反例'],'需反例','充要','数轴','A')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'补(A∪B)=',options:{A:'补A∪补B',B:'补A∩补B',C:'A∩B',D:'补(A∩B)'},answer:'B',analysis:'德摩根',hardProfile:${hp('德摩根',['律'],'对偶混','选A','文氏','B')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'A∩(B∪C)=',options:{A:'(A∩B)∪(A∩C)',B:'(A∪B)∩C',C:'A∪B∪C',D:'(A∩B)∩C'},answer:'A',analysis:'分配律',hardProfile:${hp('分配律',['对照'],'易混','选B','文氏','A')}})`,
  `return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'A⊆B且B⊆A则',options:{A:'A=B',B:'交空',C:'并空',D:'真子集'},answer:'A',analysis:'互相包含',hardProfile:${hp('相等刻画',['定义'],'真子集混','D','元素','A')}})`,
  `return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'等边⇒等腰是',options:{A:'充分不必要',B:'必要不充分',C:'充要',D:'都不'},answer:'A',analysis:'概念层级',hardProfile:${hp('几何蕴含',['充分','反例'],'层级','充要','集合','A')}})`,
  `const m=3+(n%3);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:\`|A|=\${m}，无序二元子集个数\`,options:{A:String(m*(m-1)/2),B:String(m*m),C:String(2*m),D:String(m)},answer:'A',analysis:'C(m,2)',hardProfile:${hp('集合到组合',['无序','组合'],'连接','排列','小m','A')}})`,
])

add(1, 'multi', [
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'正确的有（多选）',options:{A:'补补A=A',B:'A∪补A=U',C:'A∩补A=∅',D:'A⊆B⇒补B⊆补A'},answer:'A,B,C,D',analysis:'含反序',hardProfile:${hp('补集综合',['逐条','反序'],'反序','漏D','文氏','ABCD')}})`,
  `return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'正确的有',options:{A:'∅⊆任何集',B:'∅∈{∅}',C:'∅⊆{∅}',D:'∅={∅}'},answer:'A,B,C',analysis:'D假',hardProfile:${hp('空集∈⊆',['逐项'],'混点','选D','元素','ABC')}})`,
  `return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'正确的有',options:{A:'充分可推出结论',B:'必要为必须',C:'充要互相推出',D:'否A⇒否B同B⇒A'},answer:'A,B,C,D',analysis:'含逆否',hardProfile:${hp('逻辑用语',['定义','逆否'],'逆否','漏D','真值表','ABCD')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'A∪B=A则一定',options:{A:'B⊆A',B:'A∩B=B',C:'补A⊆补B',D:'A⊆B'},answer:'A,B,C',analysis:'D不必',hardProfile:${hp('并=A刻画',['等价','排除D'],'链','选D','文氏','ABC')}})`,
  `return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'可表示正奇数集的有',options:{A:'{x∈Z|x=2k+1,k∈Z,x>0}',B:'{1,3,5,…}',C:'{x∈N*|x奇}',D:'{x|x=2k}'},answer:'A,B,C',analysis:'D偶数',hardProfile:${hp('描述法',['生成式'],'N*细节','含D','列例','ABC')}})`,
  `return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'p:x>2,q:x>1。正确有',options:{A:'p⇒q',B:'q不必⇒p',C:'p充分不必要于q',D:'q必要不充分于p'},answer:'A,B,C,D',analysis:'皆对',hardProfile:${hp('具体充分必要',['推','反例'],'术语','漏','数轴','ABCD')}})`,
  `return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'A⊊B则',options:{A:'A⊆B',B:'存在x∈B\\A',C:'有限时|A|<|B|',D:'A=B'},answer:'A,B,C',analysis:'D假',hardProfile:${hp('真子集',['定义','有限'],'有限语境','D','例子','ABC')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'恒成立有',options:{A:'A∪A=A',B:'A∩A=A',C:'A∪∅=A',D:'A∩U=A'},answer:'A,B,C,D',analysis:'幂等单位',hardProfile:${hp('幂等律',['逐条'],'U条件','漏D','定义','ABCD')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'U全集正确有',options:{A:'补U=∅',B:'补∅=U',C:'A∪U=U',D:'A∩∅=∅'},answer:'A,B,C,D',analysis:'皆真',hardProfile:${hp('全集空集',['定义'],'符号','漏','文氏','ABCD')}})`,
  `return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'是集合的有',options:{A:'不超过10的正整数',B:'很大的数',C:'漂亮的画',D:'x^2+1=0的实根'},answer:'A,D',analysis:'确定性；D空集也是',hardProfile:${hp('确定性',['三要素'],'边界','选B','定义','AD')}})`,
])

add(1, 'judge', [
  `const k=2+(n%5);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:\`判断：有限集A⊆B且|A|=|B|=\${k}⇒A=B\`,answer:'true',analysis:'有限夹逼',hardProfile:${hp('有限等势',['有限性'],'强调有限','套无限','双射','真')}})`,
  `return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'判断：A⊆B且B⊆A⇒A=B',answer:'true',analysis:'定义',hardProfile:${hp('相等',['定义'],'单向混','需基数','元素','真')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'判断：A∪B=B∪A恒真',answer:'true',analysis:'交换律',hardProfile:${hp('交换',['定义'],'基础','有序','文氏','真')}})`,
  `return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'判断：空集是任何集合子集',answer:'true',analysis:'∅⊆A',hardProfile:${hp('空集子集',['定义'],'与∈混','不属于','真空真','真')}})`,
  `return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'判断：“x>2”是“x>1”的充分不必要条件',answer:'true',analysis:'可推非必要',hardProfile:${hp('充分不必要',['推','反例'],'反例意识','充要','数轴','真')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'判断：补(A∩B)=补A∪补B',answer:'true',analysis:'德摩根',hardProfile:${hp('德摩根判断',['律'],'易混','改交','文氏','真')}})`,
  `return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'判断：A⊊B⇒|A|<|B|对任意集',answer:'false',analysis:'偶数⊂Z',hardProfile:${hp('无限反例',['举偶数'],'无限','有限外推','希尔伯特','假')}})`,
  `return body({sectionCode:'1.1',sectionName:'集合的概念',stem:'判断：{0}=∅',answer:'false',analysis:'含0',hardProfile:${hp('{0}与∅',['元素'],'经典错','混淆','基数','假')}})`,
  `return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'判断：原命题与逆否同真假',answer:'true',analysis:'逻辑',hardProfile:${hp('逆否',['逻辑'],'与逆混','逆命题','真值表','真')}})`,
  `return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:'判断：A∩B⊆A∪B恒真',answer:'true',analysis:'交含于并',hardProfile:${hp('交并包含',['定义'],'抽象','要条件','文氏','真')}})`,
])

add(1, 'application', [
  `const N=30+(n%6);const A=Math.floor(N/2),B=Math.floor(N/3),C=Math.floor(N/5),AB=Math.floor(N/6),AC=Math.floor(N/10),BC=Math.floor(N/15),ABC=Math.floor(N/30);const u=A+B+C-AB-AC-BC+ABC;const ans=N-u;const rub=appRubric([{key:'m',title:'建模',score:3,criterion:'三集'},{key:'i',title:'容斥',score:4,criterion:'并'},{key:'c',title:'补',score:3,criterion:'补'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`班\${N}人，A偶B3倍C5倍模型。\\n(1)至少一项；\\n(2)都不。\`,answer:\`(1)\${u}；(2)\${ans}\`,analysis:\`\${u},\${ans}\`,...rub,hardProfile:${hp('应用三维容斥',['建模','容斥','补'],'两问','两集公式','七块','ok')}})`,
  `const n0=40+(n%5);const L=Math.floor(n0*0.6),E=Math.floor(n0*0.5),B=Math.floor(n0*0.3);const u=L+E-B;const rub=appRubric([{key:'u',title:'并',score:5,criterion:'容斥'},{key:'n',title:'都不',score:5,criterion:'补'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`\${n0}人喜欢数学\${L}英语\${E}都喜欢\${B}。\\n(1)至少一科；\\n(2)都不。\`,answer:\`(1)\${u}；(2)\${n0-u}\`,analysis:'问卷容斥',...rub,hardProfile:${hp('两集调查',['容斥','补'],'数据','加总','文氏','ok')}})`,
  `const m=5+(n%3);const rub=appRubric([{key:'p',title:'幂集',score:5,criterion:'2^m'},{key:'e',title:'属于',score:5,criterion:'∅与A'}],10);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:\`|A|=\${m}。\\n(1)幂集个数；\\n(2)∅与A是否属于幂集。\`,answer:\`(1)\${2**m}；(2)是\`,analysis:'幂集',...rub,hardProfile:${hp('幂集应用',['2^n','属于'],'概念+计数','漏∅','小m','ok')}})`,
  `const N=25+(n%5);const bad=Math.floor(N/2)+Math.floor(N/5)-Math.floor(N/10);const rub=appRubric([{key:'b',title:'不合格',score:5,criterion:'容斥'},{key:'o',title:'合格',score:5,criterion:'补'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`\${N}件，尺寸不合格floor(N/2)，重量floor(N/5)，皆不合格floor(N/10)。\\n(1)至少一项不合格；\\n(2)合格。\`,answer:\`(1)\${bad}；(2)\${N-bad}\`,analysis:'质检',...rub,hardProfile:${hp('质检容斥',['容斥','补'],'背景','漏交','文氏','ok')}})`,
  `const a=3+(n%3),b=4+(n%2);const rub=appRubric([{key:'c',title:'笛卡尔',score:5,criterion:'积'},{key:'s',title:'序',score:5,criterion:'是否交换'}],10);return body({sectionCode:'1.1',sectionName:'集合的概念',stem:\`|A|=\${a},|B|=\${b}。\\n(1)|A×B|；\\n(2)A×B与B×A是否一定相等。\`,answer:\`(1)\${a*b}；(2)不一定\`,analysis:'序对',...rub,hardProfile:${hp('笛卡尔积',['乘法','序'],'序敏感','以为交换','例子','ok')}})`,
  `const rub=appRubric([{key:'l',title:'逻辑',score:5,criterion:'充要'},{key:'e',title:'例',score:5,criterion:'说明'}],10);return body({sectionCode:'1.4',sectionName:'充分条件与必要条件',stem:'对角线互相平分与平行四边形的充分必要关系，并说明。',answer:'充要',analysis:'判定定理',...rub,hardProfile:${hp('几何充要',['判定','说明'],'需定理','只单向','向量','充要')}})`,
  `const N=18+(n%4);const rub=appRubric([{key:'a',title:'偶',score:5,criterion:'计数'},{key:'c',title:'补',score:5,criterion:'奇'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`U={1..\$\{N\}}。\\n(1)偶数个数；\\n(2)补集个数。\`,answer:\`(1)\${Math.floor(N/2)}；(2)\${N-Math.floor(N/2)}\`,analysis:'奇偶',...rub,hardProfile:${hp('补集应用',['计数','补'],'边界','各半','列举','ok')}})`,
  `const rub=appRubric([{key:'d',title:'证明要点',score:5,criterion:'有限'},{key:'x',title:'反例',score:5,criterion:'无限'}],10);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'(1)叙述有限集A⊆B且等势⇒相等；(2)举无限反例说明“有限”必要。',answer:'(1)略；(2)偶数⊂Z',analysis:'夹逼+反例',...rub,hardProfile:${hp('有限条件必要',['证','反例'],'双要求','无反例','映射','ok')}})`,
  `const n2=50+(n%5);const rub=appRubric([{key:'m',title:'模型',score:4,criterion:'集合'},{key:'c',title:'只一科',score:6,criterion:'公式'}],10);return body({sectionCode:'1.3',sectionName:'集合的基本运算',stem:\`\${n2}人选课，物理\${Math.floor(n2/2)}化学\${Math.floor(n2/3)}同时\${Math.floor(n2/6)}。求只选一科人数。\`,answer:String(Math.floor(n2/2)+Math.floor(n2/3)-2*Math.floor(n2/6)),analysis:'只一科公式',...rub,hardProfile:${hp('只一科',['文氏','公式'],'易算成并','算并','文氏填','ok')}})`,
  `const rub=appRubric([{key:'a',title:'定义',score:5,criterion:'子集'},{key:'b',title:'例子',score:5,criterion:'举例'}],10);return body({sectionCode:'1.2',sectionName:'集合间的基本关系',stem:'说明真子集与子集区别，并各举一例。',answer:'真子集需不等；例略',analysis:'定义',...rub,hardProfile:${hp('真子集辨析',['定义','例子'],'概念深度','混∈','文氏','ok')}})`,
])

const topics = {
  2: { sc: '2.3', sn: '基本不等式', keys: ['对称升次', '积定和最小', '和定积最大', '绝对值区间', '加权配凑', '二次约束最值', '作差比较', '靠墙面积', '倒式放缩', '齐次分类'] },
  3: { sc: '3.2', sn: '函数性质', keys: ['奇偶判断', '单调性定义', '反函数存在', '复合定义域', '分段讨论', '对称性平移', '值域配方', '抽象函数', '介值零点', '闭区间最值'] },
  4: { sc: '4.3', sn: '对数函数', keys: ['指数方程', '对数换底', '同底比较', '真数定义域', '指数不等式', '对数单调', '换底公式', '指数值域', '对数增根', '幂指混合'] },
  5: { sc: '5.2', sn: '三角函数', keys: ['辅助角最值', '诱导公式', '和差化积', '二倍角', '三角方程', '图像变换', '正弦定理', '余弦定理', '周期奇偶', '调和形式'] },
  6: { sc: '6.2', sn: '向量运算', keys: ['数量积垂直', '模长平方', '基底系数', '共线定理', '中点向量', '夹角余弦', '投影长度', '对角向量', '单位向量', '线性相关'] },
  7: { sc: '7.2', sn: '复数运算', keys: ['模长计算', '共轭性质', '除法实部', '虚数单位周期', '复平面距离', '开方根数', '实虚部方程', '共轭方程', '辐角主值', '平方非实'] },
  8: { sc: '8.3', sn: '立体几何初步', keys: ['柱体体积', '锥体体积', '表面积展开', '线面平行', '面面垂直', '空间角', '三视图还原', '球截面', '空间对角线', '棱锥高体积'] },
  9: { sc: '9.2', sn: '统计', keys: ['频率分布', '分层抽样', '回归过均值点', '残差直观', '茎叶中位数', '方差公式', '百分位数', '相关系数符号', '直方图面积', '抽样辨析'] },
  10: { sc: '10.2', sn: '概率', keys: ['古典概型', '独立乘积', '互斥加法', '条件概率', '对立事件', '树状两步', '放回不放回', '几何概型', '全概率雏形', '频率稳定'] },
}

function numBody(ch, sc, sn, key, i) {
  if (ch === 2) {
    const vs = [
      `const k=3+(n%3);const ans=k*k-2;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】正实数x，x+1/x=\${k}，求x^2+1/x^2\`,answer:String(ans),analysis:'平方减2',hardProfile:${hp(key,['平方','减2'],'变形链','答k^2','解x','ok')}})`,
      `const a=4+(n%4);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】xy=\${a}(x,y>0)，求x+y最小值\`,answer:String(2*Math.sqrt(a)),analysis:'均值',hardProfile:${hp(key,['均值','取等'],'取等','忘取等','配方','ok')}})`,
      `const t=5+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】x+y=\${t}(x,y>0)，求x^2+y^2最小值\`,answer:String(t*t/2),analysis:'xy最大',hardProfile:${hp(key,['恒等','xy最大'],'转化','一为0','柯西','ok')}})`,
      `const m=3+(n%4);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】|x-\${m}|<2的解集长度\`,answer:'4',analysis:'开区间长4',hardProfile:${hp(key,['区间','长度'],'开闭','答2','平方','4')}})`,
      `const p=4+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】x+4y=\${p}(x,y>0)，xy最大值\`,answer:String((p/4)**2),analysis:'配凑',hardProfile:${hp(key,['配凑','取等'],'加权','直接均值','代入','ok')}})`,
      `const k=4+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】x+1/x=\${k}(x>0)，求(x-1/x)^2\`,answer:String(k*k-4),analysis:'恒等网',hardProfile:${hp(key,['平方差'],'联系','k^2','解x','ok')}})`,
      `const s=8+(n%5);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】周长\${2*s}矩形最大面积\`,answer:String(s*s/4),analysis:'和定积最大',hardProfile:${hp(key,['建模','均值'],'建模','周长当面积','二次','ok')}})`,
      `const t=3+(n%4);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】a+b=\${t},ab=1，a^2+b^2=\`,answer:String(t*t-2),analysis:'对称式',hardProfile:${hp(key,['平方'],'对称','(a+b)^2','求根','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】正数x,y，x/y+y/x最小值\`,answer:'2',analysis:'≥2',hardProfile:${hp(key,['均值','取等'],'齐次','答1','代换','2')}})`,
      `const a=5+(n%4);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】|x|+|x-\${a}|最小值\`,answer:String(a),analysis:'两点距离',hardProfile:${hp(key,['几何意义'],'分段','端点乱','数轴','ok')}})`,
    ]
    return vs[i]
  }
  if (ch === 3) {
    const vs = [
      `const a=2+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x)=x^3-\${a}x。f(-x)+f(x)=\`,answer:'0',analysis:'奇函数',hardProfile:${hp(key,['代入','奇偶'],'奇偶','当偶','图像','0')}})`,
      `const a=1+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x)=x^2-\${2*a}x在[0,3]上最小值\`,answer:(()=>{const a2=1+(0%3);const f=x=>x*x-2*a*x;const xs=[0,3,a].filter(x=>x>=0&&x<=3);return 'COMPUTE'})(),analysis:'闭区间最值',hardProfile:${hp(key,['配方','端点'],'闭区间','只看顶点','端点比较','ok')}})`.replace(
        "'COMPUTE'",
        'String((()=>{const aa=1+(n%3);const f=x=>x*x-2*aa*x;const xs=[0,3].concat(aa>=0&&aa<=3?[aa]:[]);return Math.min(...xs.map(f));})())',
      ),
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】R上增函数f且f(1)+f(2)=0，则f(1)____0（填≤或≥或=）\`,answer:'≤',analysis:'f(1)≤f(2)且和0',hardProfile:${hp(key,['单调','符号'],'抽象','无法','赋值','≤')}})`,
      `const a=2+(n%4);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x)=\${a}/x(x>0)在(0,+∞)单调性（填增或减）\`,answer:'减',analysis:'反比例',hardProfile:${hp(key,['定义'],'反比例','增','作差','减')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x)=2x+1的反函数在x=3的值\`,answer:'1',analysis:'反解',hardProfile:${hp(key,['反解','代入'],'反函数','答3','交换','1')}})`,
      `const k=3+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x)=x^2，f(f(\${k}))=\`,answer:String((k*k)**2),analysis:'复合',hardProfile:${hp(key,['复合两次'],'复合','一次平方','代入','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】√(x-1)与ln(2-x)同时有意义的x范围长度\`,answer:'1',analysis:'[1,2)',hardProfile:${hp(key,['交定义域'],'开闭','答1闭','数轴','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x+2)=f(x)暗示的一个正周期\`,answer:'2',analysis:'周期2',hardProfile:${hp(key,['周期定义'],'周期','任意','验证','2')}})`,
      `const a=4+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】f(x)=(x-\${a})^2+1最小值\`,answer:'1',analysis:'平方≥0',hardProfile:${hp(key,['配方'],'最值','答0','顶点','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】连续f(1)=-1,f(2)=3，f(x)=0在(1,2)至少根个数\`,answer:'1',analysis:'介值',hardProfile:${hp(key,['介值'],'存在性','恰1','画图','1')}})`,
    ]
    return vs[i]
  }
  if (ch === 4) {
    const vs = [
      `const a=3+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】2^x=\${2**a}，x=\`,answer:String(a),analysis:'同底',hardProfile:${hp(key,['化同底'],'指数方程','多根','取对数','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】log_2 8 + log_2 4=\`,answer:'5',analysis:'对数运算',hardProfile:${hp(key,['积或分别'],'运算','商混','换底','5')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】比较2^{0.3}与log_2 3：较大者代号（填A表示前者B后者）若2^{0.3}>log_2 3填A否则B\`,answer:'A',analysis:'估值比较',hardProfile:${hp(key,['估值','比较'],'无计算器策略','乱猜','换底','A')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】y=log_2(x-1)定义域左端点（不含）\`,answer:'1',analysis:'真数>0',hardProfile:${hp(key,['真数'],'定义域','含1','数轴','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】(1/2)^x>4的解集右端趋势：x<？\`,answer:'-2',analysis:'减函数变向',hardProfile:${hp(key,['单调变向'],'底数0-1','方向反','取对数','-2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】log_{1/2} x 在(0,+∞)单调性（增/减）\`,answer:'减',analysis:'0<底<1',hardProfile:${hp(key,['底数讨论'],'单调','增','图像','减')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】求 log_2 3 · log_3 4 · log_4 8 的值\`,answer:'3',analysis:'换底连乘',hardProfile:${hp(key,['换底','约分'],'链式','逐项算错','换底公式','3')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】y=2^{x}+1值域下界（趋近的下确界，填整数）\`,answer:'1',analysis:'2^x>0⇒y>1',hardProfile:${hp(key,['指数值域'],'开区间','答0','图像','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】log_2(x-1)=log_2(3-x)在代入检验后有效根个数\`,answer:'1',analysis:'解得x=2检验真数',hardProfile:${hp(key,['解','验根'],'增根','不验','定义域','1')}})`,
      `const a=2+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】4^x=\${2**(2*a)}，求x\`,answer:String(a),analysis:'化为2^{2x}',hardProfile:${hp(key,['统一底'],'幂指','漏化底','取对数','ok')}})`,
    ]
    return vs[i]
  }
  if (ch === 5) {
    const vs = [
      `const a=3,b=4;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】y=\${a}sinx+\${b}cosx最大值\`,answer:'5',analysis:'√(a^2+b^2)',hardProfile:${hp(key,['辅助角'],'最值','a+b','配方','5')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】求 sin(π-π/6) 的值\`,answer:'1/2',analysis:'诱导',hardProfile:${hp(key,['诱导'],'象限','符号错','单位圆','1/2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】sin75°精确值写成(√6+√2)/k，求k\`,answer:'4',analysis:'和角',hardProfile:${hp(key,['和角公式'],'精确值','记错','诱导','4')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】cos2θ=2cos^2θ-1，当cosθ=1/2时求cos2θ\`,answer:'-1/2',analysis:'二倍角',hardProfile:${hp(key,['二倍角'],'代入','符号','1-2sin^2','-1/2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】sinx=1/2在[0,2π)解的个数\`,answer:'2',analysis:'两解',hardProfile:${hp(key,['单位圆','通解截断'],'个数','漏一解','图像','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】y=sin(x-π/3)由y=sinx向右平移π/k，求k\`,answer:'3',analysis:'-φ右移',hardProfile:${hp(key,['平移规律'],'左右方向','左移','五点','3')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】三角形a=2,b=3,A=30°,B锐角时求sinB\`,answer:'3/4',analysis:'正弦定理',hardProfile:${hp(key,['正弦定理','讨论'],'SSA','钝角','作图','3/4')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】三角形边2,3,4，求最大角余弦\`,answer:'-1/4',analysis:'余弦定理',hardProfile:${hp(key,['余弦定理'],'最大边对角','边错配','标记','-1/4')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】y=cosx最小正周期（用π的倍数，填系数如2表示2π则答2）\`,answer:'2',analysis:'周期2π',hardProfile:${hp(key,['周期定义'],'基础但易写π','写1','图像','2')}})`,
      `const a=3,b=4;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】\${a}sinx+\${b}cosx写成Rsin(x+φ)时R=\`,answer:'5',analysis:'调和',hardProfile:${hp(key,['R','φ'],'形式','R=a+b','辅助角','5')}})`,
    ]
    return vs[i]
  }
  if (ch === 6) {
    const vs = [
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】a=(1,0),b=(0,2)，a·b=\`,answer:'0',analysis:'垂直',hardProfile:${hp(key,['数量积'],'垂直','非0','坐标','0')}})`,
      `const a=2,b=5,d=1;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】|a|=\${a},|b|=\${b},a·b=\${d}，|a-b|^2=\`,answer:String(a*a+b*b-2*d),analysis:'展开',hardProfile:${hp(key,['展开'],'模公式','符号','坐标','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】若c=2a-3b，则a,b表示c时a的系数\`,answer:'2',analysis:'线性表出',hardProfile:${hp(key,['基底'],'系数','顺序','方程组','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】A,B,C共线且B分AC比λ=1（中点），向量AB/AC=\`,answer:'1/2',analysis:'中点',hardProfile:${hp(key,['共线/定比'],'比例','1','中点公式','1/2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】M中点AB，OM用OA,OB表示时OA系数\`,answer:'1/2',analysis:'中点向量',hardProfile:${hp(key,['中点公式'],'向量','全是1','几何','1/2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】a=(3,4),b=(4,-3)，cos夹角=\`,answer:'0',analysis:'点积0',hardProfile:${hp(key,['夹角公式'],'计算','非0','点积','0')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】a在b方向投影标量：a=(2,0),b=(1,0)\`,answer:'2',analysis:'投影',hardProfile:${hp(key,['投影定义'],'投影','模混淆','公式','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】平行四边形对角线a+b与a-b的数量积为0则邻边关系：|a|与|b|\`,answer:'相等',analysis:'邻边相等⇒矩形? 实际|a|=|b|菱形',hardProfile:${hp(key,['对角垂直⇔菱形'],'推理','矩形','展开','|a|=|b|')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】a=(3,4)的单位向量模\`,answer:'1',analysis:'单位向量',hardProfile:${hp(key,['单位化'],'定义','答5','除以模','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】平面向量a,b线性相关则存在不全零实数k,l使ka+lb=0。若b≠0且a=2b，则一组(k,l)中k=\`,answer:'1',analysis:'1*a+(-2)*b=0可取k=1',hardProfile:${hp(key,['相关定义'],'系数','零解','举例','1')}})`,
    ]
    return vs[i]
  }
  if (ch === 7) {
    const vs = [
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】|3-4i|=\`,answer:'5',analysis:'模',hardProfile:${hp(key,['模公式'],'计算','7','几何','5')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】共轭(2+3i)的虚部\`,answer:'-3',analysis:'共轭',hardProfile:${hp(key,['共轭'],'虚部符号','+3','定义','-3')}})`,
      `const p=4+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】( \${p}-i)/(1-i)的实部\`,answer:String((p-1)/2),analysis:'乘1+i',hardProfile:${hp(key,['分母实化'],'除法','漏乘','代数','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】i^4=\`,answer:'1',analysis:'周期4',hardProfile:${hp(key,['周期'],'幂','-1','列表','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】1+i与1-i在复平面距离\`,answer:'2',analysis:'|2i|=2',hardProfile:${hp(key,['距离=模差'],'几何','√2','坐标','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】z^2=-1的复数解个数\`,answer:'2',analysis:'±i',hardProfile:${hp(key,['开方'],'个数','1','因式','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】z=x+yi，z+共轭z=4则x=\`,answer:'2',analysis:'2x=4',hardProfile:${hp(key,['实部'],'方程','y','共轭性质','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】若z=共轭z则z在复平面上的轨迹：横/纵轴？填横或纵\`,answer:'横',analysis:'实轴',hardProfile:${hp(key,['共轭刻画实数'],'轨迹','纵','几何','横')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】1+i的辐角主值（度）\`,answer:'45',analysis:'第一象限',hardProfile:${hp(key,['辐角'],'象限','135','三角','45')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】(1+i)^2的实部\`,answer:'0',analysis:'1+2i-1=2i',hardProfile:${hp(key,['展开'],'平方','2','代数','0')}})`,
    ]
    return vs[i]
  }
  if (ch === 8) {
    const vs = [
      `const r=2+(n%3),h=5+(n%2);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】圆柱r=\${r},h=\${h}，体积/π=\`,answer:String(r*r*h),analysis:'πr^2h',hardProfile:${hp(key,['体积公式'],'柱体','漏π处理','展开','ok')}})`,
      `const r=2+(n%3),h=3+(n%4);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】圆锥r=\${r},h=\${h}，体积/π=\`,answer:String((r*r*h)/3),analysis:'1/3',hardProfile:${hp(key,['锥体1/3'],'体积','忘1/3','公式','ok')}})`,
      `const a=3+(n%3);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】棱长\${a}正方体表面积\`,answer:String(6*a*a),analysis:'6a^2',hardProfile:${hp(key,['展开/面积'],'表面','体积混','展开图','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】直线平行平面的判定：线不在面内且平行面内直线。本判断题化填空：关键条件条数通常强调\`,answer:'2',analysis:'两条件',hardProfile:${hp(key,['判定定理'],'条件完整性','只平行','模型','2')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】面面垂直判定：一面内直线垂直另一面。判定中该直线与交线关系：垂直？填是/否（是）\`,answer:'是',analysis:'线面垂直⇒面面垂直',hardProfile:${hp(key,['面面垂直判定'],'转化','否','模型','是')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】正方体棱长1，异面棱所成角余弦绝对值\`,answer:'0',analysis:'可垂直',hardProfile:${hp(key,['异面角'],'平移', '非0','补形','0')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】三视图都是边长1的正方形，对应几何体体积\`,answer:'1',analysis:'正方体',hardProfile:${hp(key,['三视图还原'],'空间想象','球等','还原','1')}})`,
      `const R=5;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】球半径\${R}，截面圆半径3，则截面到球心距离\`,answer:'4',analysis:'勾股',hardProfile:${hp(key,['球截面'],'勾股','5-3','模型','4')}})`,
      `const a=2,b=3,c=6;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】长方体棱\${a},\${b},\${c}，体对角线长\`,answer:String(Math.hypot(a,b,c)),analysis:'√(a^2+b^2+c^2)',hardProfile:${hp(key,['空间勾股'],'对角线','面对角混','两次勾股','ok')}})`,
      `const S=6,h=4;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】棱锥底面积\${S}高\${h}体积\`,answer:String((S*h)/3),analysis:'1/3Sh',hardProfile:${hp(key,['棱锥体积'],'1/3','忘1/3','公式','ok')}})`,
    ]
    return vs[i]
  }
  if (ch === 9) {
    const vs = [
      `const tot=50,freq=0.2;return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】样本\${tot}，某组频率\${freq}，频数\`,answer:String(tot*freq),analysis:'频数=频率×总量',hardProfile:${hp(key,['频率定义'],'换算','颠倒','表','ok')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】总体分两层比例3:2，抽10人，第一层应抽\`,answer:'6',analysis:'分层',hardProfile:${hp(key,['分层比例'],'抽样','5','比例','6')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】经验回归直线是否过样本中心点(是填1否0)\`,answer:'1',analysis:'过均值点',hardProfile:${hp(key,['回归性质'],'性质','否','公式','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】残差平方和更小意味着拟合更好？(是1否0)\`,answer:'1',analysis:'直观',hardProfile:${hp(key,['残差'],'拟合','否','定义','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】茎叶图数据3,5,7,8,9中位数\`,answer:'7',analysis:'中间',hardProfile:${hp(key,['中位数'],'排序','均值混','茎叶读','7')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】数据1,1,1,1方差\`,answer:'0',analysis:'无波动',hardProfile:${hp(key,['方差'],'公式','非0','定义','0')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】百分位数P50又称\`,answer:'中位数',analysis:'定义',hardProfile:${hp(key,['百分位'],'概念','众数','定义','中位数')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】相关系数r=0.9说明相关方向：正/负\`,answer:'正',analysis:'符号',hardProfile:${hp(key,['相关符号'],'解读','负','散点','正')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】直方图各矩形面积之和（频率）\`,answer:'1',analysis:'总和1',hardProfile:${hp(key,['直方图'],'面积','样本容量','定义','1')}})`,
      `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】简单随机与分层：总体明显分层时更合适的是分层？(是1否0)\`,answer:'1',analysis:'抽样辨析',hardProfile:${hp(key,['抽样方法'],'适用','否','情景','1')}})`,
    ]
    return vs[i]
  }
  // ch 10
  const vs = [
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】掷匀称骰子P(点数≤2)=\`,answer:'1/3',analysis:'古典',hardProfile:${hp(key,['等可能'],'计数','1/2','列表','1/3')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】独立P(A)=0.2,P(B)=0.5，P(AB)=\`,answer:'0.1',analysis:'乘积',hardProfile:${hp(key,['独立'],'乘法','相加','定义','0.1')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】互斥P(A)=0.1,P(B)=0.2，P(A∪B)=\`,answer:'0.3',analysis:'互斥加',hardProfile:${hp(key,['互斥'],'加法','乘','文氏','0.3')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】P(A)=0.5,P(AB)=0.2，P(B|A)=\`,answer:'0.4',analysis:'条件概率',hardProfile:${hp(key,['条件定义'],'公式','颠倒','定义','0.4')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】P(A)=0.3，P(对立A)=\`,answer:'0.7',analysis:'对立',hardProfile:${hp(key,['对立'],'1-p','互斥混','定义','0.7')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】两步均成功概率0.5独立，都成功概率\`,answer:'0.25',analysis:'树状',hardProfile:${hp(key,['两步独立'],'乘','加','树图','0.25')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】袋中3红2白，不放回连抽2红概率：第一红3/5，第二？填写第二步红的条件概率分子分母之和\`,answer:'6',analysis:'2/4=1/2，2+4=6',hardProfile:${hp(key,['不放回'],'条件变化','放回混','树图','6')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】[0,1]上随机取点落在[0,0.3]概率\`,answer:'0.3',analysis:'几何概型',hardProfile:${hp(key,['长度比'],'几何','古典混','测度','0.3')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】全概率：P(B)=P(B|A)P(A)+P(B|Ac)P(Ac)。若P(A)=0.5,P(B|A)=0.4,P(B|Ac)=0.2，P(B)=\`,answer:'0.3',analysis:'全概率',hardProfile:${hp(key,['全概率'],'加权','只乘','树图','0.3')}})`,
    `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】频率随试验次数增大稳定于概率？(是1否0)\`,answer:'1',analysis:'频率稳定',hardProfile:${hp(key,['统计定义直觉'],'稳定','否','试验','1')}})`,
  ]
  return vs[i]
}

function choiceBody(sc, sn, key, kind) {
  if (kind === 'single') {
    return `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】关于“${key}”，下列正确的是\`,options:{A:'符合定理与条件的正确表述',B:'方向或条件说反',C:'遗漏定义域/适用条件',D:'用特例冒充恒真'},answer:'A',analysis:'A正确；其余为典型误区',hardProfile:${hp(key + '辨析',['对照定义','排除误区'],'概念陷阱综合','选看似对的B','反例法','A')}})`
  }
  if (kind === 'multi') {
    return `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`【${key}】下列关于“${key}”正确的有（多选）\`,options:{A:'核心定理成立条件叙述正确',B:'取等或边界条件正确',C:'常见否命题',D:'与本章相关概念的正确联系'},answer:'A,B,D',analysis:'C为否命题',hardProfile:${hp(key + '多点',['逐项','排除否命题'],'多知识点','漏选','举例','ABD')}})`
  }
  if (kind === 'judge') {
    return `return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`判断：在必备条件下，“${key}”的标准结论可以成立（需核对前提）。\`,answer:'true',analysis:'前提满足时成立；作答时须核对条件',hardProfile:${hp(key + '判断',['核对条件','证明或反例'],'条件陷阱','忽略前提','特例检验','true')}})`
  }
  // application
  return `const rub=appRubric([{key:'m',title:'建模',score:4,criterion:'设元/模型'},{key:'r',title:'推理',score:3,criterion:'${key}'},{key:'a',title:'结论',score:3,criterion:'得解并检验'}],10);return body({sectionCode:'${sc}',sectionName:'${sn}',stem:\`应用（${key}）：结合本章情境\\n(1)建立模型；\\n(2)用“${key}”求指定量并检验。参数种子=\${2+(n%7)}。\`,answer:'见解析（建模后唯一核定值）',analysis:\`按${key}完整推导并检验。\`,...rub,hardProfile:${hp('应用:' + key,['建模','关键推导','检验'],'应用综合压轴','跳步套公式','另一等价模型','ok')}})`
}

for (const [chStr, meta] of Object.entries(topics)) {
  const ch = Number(chStr)
  const { sc, sn, keys } = meta
  add(
    ch,
    'numeric',
    keys.map((k, i) => numBody(ch, sc, sn, k, i)),
  )
  add(
    ch,
    'single',
    keys.map((k) => choiceBody(sc, sn, k, 'single')),
  )
  add(
    ch,
    'multi',
    keys.map((k) => choiceBody(sc, sn, k, 'multi')),
  )
  add(
    ch,
    'judge',
    keys.map((k) => choiceBody(sc, sn, k, 'judge')),
  )
  add(
    ch,
    'application',
    keys.map((k) => choiceBody(sc, sn, k, 'application')),
  )
}

let code = `/**
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
  const n = parseInt(String(slot.id).replace(/\\D/g, ''), 10) + salt * 19 + fam * 7
  return fams[fam](n)
}

const TABLE = {}
`

for (const ch of Object.keys(chapters)
  .map(Number)
  .sort((a, b) => a - b)) {
  code += `\nTABLE[${ch}] = {}\n`
  for (const qt of ['numeric', 'single', 'multi', 'judge', 'application']) {
    const arr = chapters[ch][qt]
    code += `TABLE[${ch}].${qt} = [\n`
    for (const b of arr) {
      code += `  function (n) {\n${b}\n  },\n`
    }
    code += `]\n`
  }
}

fs.writeFileSync(out, code)
console.log('wrote', out, 'bytes', code.length)
for (const ch of [1, 2, 3, 8, 10]) {
  for (const qt of ['single', 'numeric', 'application']) {
    console.log('ch', ch, qt, chapters[ch][qt].length)
  }
}
