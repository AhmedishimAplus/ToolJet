import React, { useState, useEffect } from 'react';
import { default as BootstrapModal } from 'react-bootstrap/Modal';
import moment from 'moment';
import { appsService } from '@/_services';
import { toast } from 'react-hot-toast';
import { ButtonSolid } from '@/_components/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { useScreenReader } from '@/modules/common/hooks';

export default function ExportAppModal({ title, show, closeModal, customClassName, app, darkMode }) {
  const { user } = useStore((state) => state.user);
  const { speak } = useScreenReader();

  const [versions, setVersions] = useState(undefined);
  const [tables, setTables] = useState(undefined);
  const [allTables, setAllTables] = useState(undefined);
  const [versionId, setVersionId] = useState(undefined);
  const [exportTjDb, setExportTjDb] = useState(true);
  const [currentVersion, setCurrentVersion] = useState(undefined);
  const [versionSelectLoading, setVersionSelectLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Navigation order configuration - can be customized based on modal context
  const getNavigationOrder = () => {
    const baseOrder = [
      { element: 'close-button', tabIndex: 1 },
      { element: 'selected-version', tabIndex: 2 },
      { element: 'selected-version-input', tabIndex: 3 },
    ];

    // Add other versions dynamically
    const otherVersionsCount = versions ? versions.filter(v => v.id !== currentVersion?.id).length : 0;
    let nextTabIndex = 4;

    for (let i = 0; i < otherVersionsCount; i++) {
      baseOrder.push(
        { element: `other-version-${i}`, tabIndex: nextTabIndex++ },
        { element: `other-version-input-${i}`, tabIndex: nextTabIndex++ }
      );
    }

    // Add remaining elements
    baseOrder.push(
      { element: 'checkbox', tabIndex: nextTabIndex++ },
      { element: 'checkbox-input', tabIndex: nextTabIndex++ },
      { element: 'export-all-button', tabIndex: nextTabIndex++ },
      { element: 'export-selected-button', tabIndex: nextTabIndex++ }
    );

    return baseOrder;
  };

  // Get tab index for specific element
  const getTabIndex = (elementKey, index = 0) => {
    const order = getNavigationOrder();
    const found = order.find(item =>
      item.element === elementKey ||
      item.element === `${elementKey}-${index}`
    );
    return found ? found.tabIndex.toString() : "0";
  };  // Debug modal state and keyboard events
  useEffect(() => {
    if (show) {
      console.log('🚀 MODAL OPENED: ExportAppModal');
      console.log('📋 NAVIGATION ORDER:', getNavigationOrder());

      // Debug all focusable elements in the modal
      setTimeout(() => {
        const modal = document.querySelector('.modal.show');
        if (modal) {
          const allElements = modal.querySelectorAll('*');
          const focusableElements = modal.querySelectorAll('[tabindex]:not([tabindex="-1"]), button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), select:not([disabled]), a[href]:not([disabled])');
          console.log('📋 FOCUSABLE ELEMENTS IN MODAL:', focusableElements.length);
          console.log('🔍 ALL ELEMENTS WITH TABINDEX:');

          Array.from(allElements).forEach((el) => {
            if (el.hasAttribute('tabindex')) {
              console.log(`   ${el.tagName} (tabIndex=${el.tabIndex}) - ${el.className.substring(0, 50)} - ${el.getAttribute('data-cy') || 'no data-cy'}`);
            }
          });

          console.log('🎯 SORTED BY TABINDEX:');
          const sortedElements = Array.from(focusableElements).sort((a, b) => {
            const aIndex = a.tabIndex === 0 ? 999 : a.tabIndex;
            const bIndex = b.tabIndex === 0 ? 999 : b.tabIndex;
            return aIndex - bIndex;
          });

          sortedElements.forEach((el, index) => {
            console.log(`   ${index + 1}. ${el.tagName} (tabIndex=${el.tabIndex}) - ${el.className.substring(0, 50)} - ${el.getAttribute('data-cy') || 'no data-cy'}`);
          });
        }
      }, 100);

      const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
          console.log(`⌨️  TAB pressed (${e.shiftKey ? 'Shift+' : ''}Tab), active element:`, document.activeElement);
          console.log('   - Tag:', document.activeElement.tagName);
          console.log('   - Classes:', document.activeElement.className);
          console.log('   - TabIndex:', document.activeElement.tabIndex);
          console.log('   - Data-cy:', document.activeElement.getAttribute('data-cy'));

          // Show next focusable element
          setTimeout(() => {
            console.log(`🎯 NEXT FOCUSED: ${document.activeElement.tagName} (tabIndex=${document.activeElement.tabIndex})`);
          }, 10);
        }
      }; document.addEventListener('keydown', handleKeyDown);

      return () => {
        console.log('❌ MODAL CLOSED: ExportAppModal');
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [show]);

  useEffect(() => {
    async function fetchAppVersions() {
      setLoading(true);
      try {
        const fetchVersions = await appsService.getVersions(app.appId || app.id);
        const fetchTables = await appsService.getTables(app.appId || app.id); // this is used to get all tables
        const { versions } = fetchVersions;
        const { tables } = fetchTables;
        setVersions(versions);
        setAllTables(tables);
        const currentEditingVersion = versions?.filter((version) => version?.isCurrentEditingVersion)[0];
        if (currentEditingVersion) {
          setCurrentVersion(currentEditingVersion);
          setVersionId(currentEditingVersion?.id);
        }
      } catch (error) {
        toast.error('Could not fetch the versions.', {
          position: 'top-center',
        });
        closeModal();
      }
      setLoading(false);
    }
    fetchAppVersions();
  }, [app, closeModal]);

  useEffect(() => {
    async function fetchAppTables() {
      setVersionSelectLoading(true);
      try {
        if (!versionId) return;
        const tbl = await appsService.getAppByVersion(app.appId || app.id, versionId); // this is used to get particular App by version
        const { dataQueries = [] } = tbl?.editing_version || {};
        const extractedIdData = [];
        dataQueries.forEach((item) => {
          if (item.kind === 'tooljetdb' && item.options?.operation === 'join_tables') {
            const joinOptions = item.options?.join_table?.joins ?? [];
            (joinOptions || []).forEach((join) => {
              const { table, conditions } = join;
              if (table) extractedIdData.push(table);
              conditions?.conditionsList?.forEach((condition) => {
                const { leftField, rightField } = condition;
                if (leftField?.table) {
                  extractedIdData.push(leftField?.table);
                }
                if (rightField?.table) {
                  extractedIdData.push(rightField?.table);
                }
              });
            });
          }

          if (item.kind === 'tooljetdb' && item.options.tableId) extractedIdData.push(item.options.tableId);
        });
        const uniqueSet = new Set(extractedIdData);
        const selectedVersiontable = Array.from(uniqueSet).map((item) => ({ table_id: item }));
        setTables(selectedVersiontable);
      } catch (error) {
        toast.error('Could not fetch the tables.', {
          position: 'top-center',
        });
        closeModal();
      }
      setVersionSelectLoading(false);
    }
    fetchAppTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionId]);

  async function autoExportModule() {
    try {
      exportApp(app, null, versionId, allTables);
    } catch (error) {
      closeModal();
    }
  }

  // Auto-export for modules
  useEffect(() => {
    if (app.type === 'module' && show && allTables && currentVersion && !loading) {
      autoExportModule();
    }
  }, [app, show, allTables, currentVersion, loading]);

  const exportApp = (app, versionId, exportTjDb, exportTables) => {
    const appOpts = {
      app: [
        {
          id: app.appId || app.id,
          ...(versionId && { search_params: { version_id: versionId } }),
        },
      ],
    };

    const requestBody = {
      ...appOpts,
      ...(exportTjDb && { tooljet_database: exportTables }),
      organization_id: app.organization_id || app.organizationId,
    };

    appsService
      .exportResource(requestBody, app.type)
      .then((data) => {
        const appName = (app.appName || app.name).replace(/\s+/g, '-').toLowerCase();
        const fileName = `${appName}-export-${new Date().getTime()}`;
        // simulate link click download
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`${app?.type === 'module' ? 'Module' : 'App'} has been exported successfully!`);
        closeModal();
      })
      .catch((error) => {
        toast.error(`Could not export ${app.type === 'module' ? 'module' : 'app'}: ${error.data.message}`, {
          position: 'top-center',
        });
        closeModal();
      });
  };

  // Don't render modal for modules - they auto-export
  if (app.type === 'module') {
    return null;
  }

  return (
    <BootstrapModal
      onHide={() => closeModal(false)}
      contentClassName={`home-modal-component home-version-modal-component ${customClassName ? ` ${customClassName}` : ''
        } ${darkMode && 'dark-theme'}`}
      show={show}
      backdrop={true}
      keyboard={true}
      enforceFocus={false}
      animation={false}
      onEscapeKeyDown={() => closeModal()}
      centered
      data-cy={'modal-component'}
    >
      <BootstrapModal.Header>
        <BootstrapModal.Title data-cy={`${title.toLowerCase().replace(/\s+/g, '-')}-title`}>
          {title}
        </BootstrapModal.Title>
        <button
          className="btn-close"
          aria-label="Close"
          onClick={() => closeModal()}
          data-cy="modal-close-button"
          tabIndex={getTabIndex('close-button')}
          onFocus={() => console.log(`🎯 FOCUS: Close button (tabIndex=${getTabIndex('close-button')})`)}
          onBlur={() => console.log('👋 BLUR: Close button')}
        ></button>
      </BootstrapModal.Header>
      {Array.isArray(versions) && !loading ? (
        <>
          <BootstrapModal.Body>
            <div>
              <div className="current-version " data-cy="current-version-section">
                <span data-cy="current-version-label" className="current-version-label">
                  Current Version
                </span>
                <InputRadioField
                  versionId={currentVersion?.id}
                  data-cy={`${currentVersion?.id.toLowerCase().replace(/\s+/g, '-')}-value`}
                  versionName={currentVersion?.name}
                  versionCreatedAt={currentVersion?.created_at || currentVersion?.createdAt}
                  checked={versionId === currentVersion?.id}
                  setVersionId={setVersionId}
                  className="current-version-wrap"
                  tabIndex={getTabIndex('selected-version')}
                  inputTabIndex={getTabIndex('selected-version-input')}
                  speak={speak}
                />
              </div>
              {versions.length >= 2 ? (
                <div
                  className="other-versions"
                  data-cy="other-version-section"
                  role="group"
                  aria-label="Other Versions section"
                >
                  <span data-cy="other-version-label" className="other-version-label">
                    Other Versions
                  </span>
                  {versions
                    .filter(version => version.id !== currentVersion?.id)
                    .map((version, filteredIndex) => {
                      return (
                        <InputRadioField
                          key={version.id}
                          versionId={version.id}
                          data-cy={`${version.id.toLowerCase().replace(/\s+/g, '-')}-value`}
                          versionName={version.name}
                          versionCreatedAt={version.createdAt || version.created_at}
                          checked={versionId === version.id}
                          setVersionId={setVersionId}
                          className="other-version-wrap"
                          tabIndex={getTabIndex('other-version', filteredIndex)}
                          inputTabIndex={getTabIndex('other-version-input', filteredIndex)}
                          speak={speak}
                        />
                      );
                    })}
                </div>
              ) : (
                <div className="other-versions" data-cy="other-version-section">
                  <span data-cy="no-other-versions-found-text">No other versions found</span>
                </div>
              )}
            </div>
          </BootstrapModal.Body>
          <div
            className="tj-version-wrap-sub-footer"
            tabIndex={getTabIndex('checkbox')}
            role="button"
            aria-label="Toggle export ToolJet table schema"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExportTjDb(!exportTjDb);
              }
            }}
            style={{
              cursor: 'pointer',
              outline: 'none',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              console.log(`🎯 FOCUS: Checkbox container (tabIndex=${getTabIndex('checkbox')})`);
              e.target.style.boxShadow = '0 0 0 2px rgba(48, 132, 245, 0.5)';
            }}
            onBlur={(e) => {
              console.log('👋 BLUR: Checkbox container');
              e.target.style.boxShadow = 'none';
            }}
          >
            <input
              type="checkbox"
              checked={exportTjDb}
              onChange={() => setExportTjDb(!exportTjDb)}
              aria-label="Export ToolJet table schema"
              tabIndex={getTabIndex('checkbox-input')}
              onFocus={() => speak('Export ToolJet table schema checkbox')}
            />
            <p>Export ToolJet table schema</p>
          </div>
          <BootstrapModal.Footer className="export-app-modal-footer d-flex justify-content-end align-items-center ">
            <ButtonSolid
              className="import-export-footer-btns"
              variant="tertiary"
              data-cy="export-all-button"
              onClick={() => {
                speak('Exporting all versions');
                setTimeout(() => exportApp(app, null, exportTjDb, allTables), 1000);
              }}
              onFocus={() => speak('Export All button')}
              tabIndex={getTabIndex('export-all-button')}
            >
              Export All
            </ButtonSolid>
            <ButtonSolid
              className={`import-export-footer-btns ${versionSelectLoading ? 'btn-loading' : ''}`}
              data-cy="export-selected-version-button"
              onClick={() => {
                speak('Exporting selected version');
                setTimeout(() => exportApp(app, versionId, exportTjDb, tables), 1000);
              }}
              onFocus={() => speak('Export selected version button')}
              tabIndex={getTabIndex('export-selected-button')}
            >
              Export selected version
            </ButtonSolid>
          </BootstrapModal.Footer>
        </>
      ) : (
        <Loader />
      )}
    </BootstrapModal>
  );
}

function InputRadioField({
  versionId,
  versionName,
  versionCreatedAt,
  checked = undefined,
  setVersionId,
  className,
  tabIndex = "0",
  inputTabIndex = "0",
  speak,
}) {
  return (
    <span
      className={`version-wrapper cursor-pointer ${className}`}
      data-cy={`${String(versionName).toLowerCase().replace(/\s+/g, '-')}-version-wrapper`}
      tabIndex={tabIndex}
      role="button"
      aria-label={`Select version ${versionName} created on ${moment(versionCreatedAt).format('Do MMM YYYY')}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setVersionId(versionId);
        }
      }}
      style={{
        outline: 'none',
        border: checked ? '2px solid #3084f5' : '1px solid transparent',
        borderRadius: '4px',
        transition: 'all 0.2s ease'
      }}
      onFocus={(e) => {
        speak(`Version ${versionName} radio button`);
        e.target.style.boxShadow = '0 0 0 2px rgba(48, 132, 245, 0.5)';
      }}
      onBlur={(e) => {
        e.target.style.boxShadow = 'none';
      }}
    >
      <input
        type="radio"
        value={versionId}
        id={`${versionName}`}
        data-cy={`${String(versionName).toLowerCase().replace(/\s+/g, '-')}-radio-button`}
        name="version"
        checked={checked}
        onClick={({ target }) => setVersionId(target.value)}
        style={{ marginLeft: '1rem' }}
        className="cursor-pointer"
        tabIndex={inputTabIndex}
        onFocus={() => console.log(`🎯 FOCUS: Radio input "${versionName}" (tabIndex=${inputTabIndex})`)}
        onBlur={() => console.log(`👋 BLUR: Radio input "${versionName}"`)}
      />
      <label
        htmlFor={`${versionName}`}
        className="d-flex flex-column cursor-pointer w-100"
        style={{ paddingLeft: '0.75rem' }}
      >
        <span data-cy={`${String(versionName).toLowerCase().replace(/\s+/g, '-')}-text`}>{versionName}</span>
        <span className="export-creation-date tj-text-sm" data-cy="created-date-label">{`Created on ${moment(
          versionCreatedAt
        ).format('Do MMM YYYY')}`}</span>
      </label>
    </span>
  );
}

function Loader() {
  return (
    <BootstrapModal.Body>
      <div className="d-flex justify-content-center align-items-center flex-column" style={{ minHeight: '30vh' }}>
        <div className="pb-2">Loading versions ...</div>
        <div className="spinner-border" role="status"></div>
      </div>
    </BootstrapModal.Body>
  );
}
