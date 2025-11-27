import React from 'react'

function IconBullet() {
  return (
    <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12l2.2 2.2L16 9.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto scroll-smooth">
        <header className="mb-10" id="top">
          <div className="rounded-2xl bg-white shadow-md p-8 border border-slate-100">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 mt-1">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-600 to-green-500 flex items-center justify-center text-white shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M8 7V5a4 4 0 018 0v2" />
                  </svg>
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold">Privacy Notice</h1>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-5xl">CPSK-Job-Connect is aware of the importance of Personal Data (defined below) protection of CPSK-Job-Connect’s customers. The collection, use and/or disclosure (collectively referred to as “Processing” or “Data Processing”) of Personal Data shall act in accordance with the Personal Data Protection Act BE 2562 as the Personal Data protection is a social responsibility so as to build trust and strong business relations between CPSK-Job-Connect and its customers. CPSK-Job-Connect hereby announces this Privacy Notice in order to inform you of your rights and legal duties, as well as terms and conditions concerning the collection, use, or disclosure of your Personal Data.</p>

                <div className="mt-4 flex items-center gap-3">
                  <span className="inline-flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">Last updated: Nov 2025</span>
                  <a href="#contact" className="text-sm text-green-600 hover:underline">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* TOC */}
          <aside className="lg:col-span-4">
            <nav aria-label="Table of contents" className="sticky top-8">
              <div className="rounded-xl border border-slate-100 p-5 bg-white shadow-sm">
                <h2 className="text-lg font-semibold mb-3">On this page</h2>
                <ul className="space-y-2">
                  <li>
                    <a href="#personal-data" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Personal Data</span>
                    </a>
                  </li>
                  <li>
                    <a href="#collection" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Collection of Personal Data</span>
                    </a>
                  </li>
                  <li>
                    <a href="#source" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Source of Personal Data</span>
                    </a>
                  </li>
                  <li>
                    <a href="#purposes" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Purposes of Processing</span>
                    </a>
                  </li>
                  <li>
                    <a href="#protection" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Data Protection</span>
                    </a>
                  </li>
                  <li>
                    <a href="#retention" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Retention Period</span>
                    </a>
                  </li>
                  <li>
                    <a href="#changes" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Changes</span>
                    </a>
                  </li>
                  <li>
                    <a href="#rights" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Data Subject Rights</span>
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="group flex items-center gap-3 p-2 rounded hover:bg-slate-50">
                      <span className="opacity-90"><IconBullet /></span>
                      <span className="text-sm text-slate-700">Contact Details</span>
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <article className="lg:col-span-8 space-y-8">
            <section id="personal-data" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold flex items-center gap-3">Personal Data</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">CPSK-Job-Connect shall collect Personal Data within the purpose, scope, and lawful and fair methods as is necessary which is defined in the scope of CPSK-Job-Connect’s corporate objectives. The Personal Data that CPSK-Job-Connect collects shall include:</p>

              <ol className="mt-4 list-decimal pl-6 space-y-2 text-sm text-slate-700">
                <li>Personal Data, including but not limited to given name, family name</li>
                <li>Contact information, including but not limited to phone number and email address</li>
                <li>Professional documents, including CV, resume, transcript, and portfolio, as voluntarily provided by the Data Subject</li>
                <li>Data obtained by CPSK-Job-Connect or automated methods from other devices, including but not limited to username, password, MAC address, IP Address, photo</li>
              </ol>

              <div className="mt-4 text-sm text-slate-700">
                <p>In this regard, CPSK-Job-Connect shall request consent from user before such collecting, except for where:</p>
                <ol className="mt-2 list-decimal pl-6 space-y-2">
                  <li>it is necessary for the performance of a contract where the collection, use, or disclosure of Personal Data is required to provide service or for performance of a contract between user and CPSK-Job-Connect;</li>
                  <li>it is to prevent or suppress a danger to a Person’s life, body or health;</li>
                  <li>it is necessary for compliance with the law;</li>
                  <li>it is necessary for legitimate interests of CPSK-Job-Connect so as to fulfill its operational objectives in which suitable measures to safeguard your rights and freedoms are put in place, including but not limited to fraud prevention, network security and safeguards for your rights and freedoms;</li>
                  <li>it is for the achievement of the purpose relating to the preparation of the historical documents or the archives for public interest, or for other purposes relating to research or statistics, in which suitable measures to safeguard your rights and freedoms are put in place;</li>
                  <li>it is necessary for the performance of a task carried out in the public interest, or it is necessary for the exercising of official authority.</li>
                </ol>
              </div>
            </section>

            <section id="collection" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Collection of Personal Data</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">Personal Data is collected only for the purposes described in this Privacy Notice and by lawful and fair means. Collection methods include:</p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-sm text-slate-700">
                <li>Direct submission by the user via registration forms, job application submissions, and file uploads.</li>
                <li>Automated collection from system logs and device information for security and analytics.</li>
              </ul>
            </section>

            <section id="source" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Source of Personal Data</h3>
              <ol className="mt-3 list-decimal pl-6 space-y-2 text-sm text-slate-700">
                <li>Personal Data can be directly obtained from you through any activities, including but not limited to registration, application submissions or other interactions with the website.</li>
                <li>Data can also be obtained from automated systems, including but not limited to system logs.</li>
              </ol>
            </section>

            <section id="purposes" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Purposes of Processing Personal Data</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">CPSK-Job-Connect may use Personal Data for the following purposes or for other purposes notified at the time of collecting Personal Data or for which user has given consent after CPSK-Job-Connect has collected such Personal Data. Reasons for collecting, using or disclosing are provided below:</p>
              <ol className="mt-4 list-decimal pl-6 space-y-2 text-sm text-slate-700">
                <li>to create and manage your user account;</li>
                <li>to allow you to apply for jobs, upload documents such as CV, resume, transcript or portfolio;</li>
                <li>to allow companies to review job applications and manage recruitment processes;</li>
                <li>to improve the platform, features, and user experience;</li>
                <li>to send important service notifications, including account verification emails;</li>
                <li>to prevent fraud or ensure the security of the system;</li>
                <li>to comply with applicable laws, regulations, or requests from authorities;</li>
                <li>for other purposes upon the explicit consent from user.</li>
              </ol>
            </section>

            <section id="protection" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Personal Data Protection</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">CPSK-Job-Connect uses appropriate technical and organizational measures to protect your Personal Data. This includes encryption password, secure storage, and access controls to ensure that your Personal Data is not accessed, used, disclosed, altered, or destroyed without authorization. Access to Personal Data is limited only to authorized personnel or service providers who require such data to operate the platform and are bound by confidentiality obligations.</p>
            </section>

            <section id="retention" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Retention Period of Personal Data</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">CPSK-Job-Connect shall retain your Personal Data for as long as necessary to fulfill the purposes stated in this Privacy Notice, or as required by applicable laws. If Personal Data is still required for legal claims, dispute resolution, or compliance with legal obligations, CPSK-Job-Connect may retain the data for a longer period as permitted by law.</p>
            </section>

            <section id="changes" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Changes to Privacy Notice</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">CPSK-Job-Connect may update this Privacy Notice from time to time. When we do, we will revise the "last updated" date and, where appropriate, notify users by email or through the platform.</p>
            </section>

            <section id="rights" className="rounded-xl p-6 bg-white border border-green-50 shadow-sm">
              <h3 className="text-2xl font-semibold">Data Subject Rights</h3>

              <div className="mt-4 p-5 border border-green-100 bg-green-50 rounded-lg">
                <p className="text-sm text-slate-800">As a user, you may exercise Data Subject Rights with respect to the law and as contemplated in this Privacy Notice, details as specified below:</p>
                <ol className="mt-3 list-decimal pl-6 space-y-2 text-sm text-slate-700">
                  <li>Right to access and obtain copy of your Personal Data;</li>
                  <li>Right to have inaccurate Personal Data rectified, or completed if it is incomplete;</li>
                  <li>Right to Data Portability in case where CPSK-Job-Connect has made such Personal Data publicly accessible in the format readable or commonly used by ways of automatic tools or equipment, and can be used or disclosed by automated methods;</li>
                  <li>Right to erase, destroy or anonymize Personal Data, should such Personal Data be no longer necessary or unless there are certain circumstances where CPSK-Job-Connect has legal grounds to reject your request;</li>
                  <li>Right to restrict the use of Personal Data under circumstances where Personal Data is subject to erasure or is no longer necessary;</li>
                  <li>Right to withdraw consent given by user; and</li>
                  <li>Right to object the Processing of Personal Data at any time.</li>
                </ol>
                <p className="mt-3 text-sm text-slate-700">Should you have any questions or wish to rectify or erase your Personal Data or to exercise the aforementioned rights or contact CPSK-Job-Connect regarding Personal Data issues or CPSK-Job-Connect’s Personal Data protection practices, please contact CPSK-Job-Connect using the details below.</p>
              </div>
            </section>

            <section id="contact" className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-semibold">Contact Details</h3>
              <div className="mt-4 text-sm text-slate-700">
                <p className="font-medium">CPSK-Job-Connect</p>
                <p className="mt-1">Email: <a className="text-green-600 hover:underline" href="mailto:cpskjobconnect@gmail.com">cpskjobconnect@gmail.com</a></p>
              </div>
            </section>

            <div className="flex justify-end">
              <a href="#top" className="text-sm text-green-600 hover:underline">Back to top</a>
            </div>
          </article>
        </div>
      </div>
    </main>
  )
}
