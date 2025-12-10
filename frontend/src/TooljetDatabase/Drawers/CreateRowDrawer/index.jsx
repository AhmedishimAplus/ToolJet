import React, { useContext, useState, useEffect } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import CreateRowForm from '../../Forms/RowForm';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { listAllPrimaryKeyColumns } from '@/TooljetDatabase/constants';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import { useScreenReader } from '@/modules/common/hooks';

const CreateRowDrawer = ({
  isCreateRowDrawerOpen,
  setIsCreateRowDrawerOpen,
  referencedColumnDetails,
  setReferencedColumnDetails,
}) => {
  const {
    organizationId,
    selectedTable,
    setSelectedTableData,
    setTotalRecords,
    pageSize,
    setSortFilters,
    setQueryFilters,
    columns,
  } = useContext(TooljetDatabaseContext);
  const { speak } = useScreenReader();
  const [shouldResetRowForm, setShouldResetRowForm] = useState(0);

  // Announce when drawer opens and focus first input
  useEffect(() => {
    if (isCreateRowDrawerOpen) {
      speak('Create row drawer opened');
      // Focus first focusable element in drawer after it renders
      setTimeout(() => {
        const drawer = document.querySelector('.tj-db-drawer');
        if (drawer) {
          const firstFocusable = drawer.querySelector('input:not([disabled]), [tabindex="0"]');
          firstFocusable?.focus();
        }
      }, 300);
    }
  }, [isCreateRowDrawerOpen, speak]);

  return (
    <>
      <Drawer
        isOpen={isCreateRowDrawerOpen}
        onClose={() => setIsCreateRowDrawerOpen(false)}
        position="right"
        className="tj-db-drawer"
      >
        <CreateRowForm
          onCreate={(shouldKeepDrawerOpen) => {
            const limit = pageSize;
            setSortFilters({});
            setQueryFilters({});

            const primaryKeyColumns = listAllPrimaryKeyColumns(columns);
            const sortQuery = new PostgrestQueryBuilder();
            primaryKeyColumns.map((primaryKeyColumnName) => {
              sortQuery.order(primaryKeyColumnName, 'desc');
            });

            tooljetDatabaseService
              .findOne(organizationId, selectedTable.id, `${sortQuery.url.toString()}&limit=${limit}`)
              .then(({ headers, data = [], error }) => {
                if (error) {
                  toast.error(error?.message ?? `Failed to fetch table "${selectedTable.table_name}"`);
                  return;
                }

                if (Array.isArray(data) && data?.length > 0) {
                  const totalContentRangeRecords = headers['content-range'].split('/')[1] || 0;
                  setTotalRecords(totalContentRangeRecords);
                  setSelectedTableData(data);
                }
              });

            const tableElement = document.querySelector('.tj-db-table');
            if (tableElement) tableElement.scrollTop = 0;
            if (!shouldKeepDrawerOpen) setIsCreateRowDrawerOpen(false);
            setShouldResetRowForm((prev) => prev + 1);
          }}
          onClose={() => setIsCreateRowDrawerOpen(false)}
          referencedColumnDetails={referencedColumnDetails}
          setReferencedColumnDetails={setReferencedColumnDetails}
          initiator="CreateRowForm"
          shouldResetRowForm={shouldResetRowForm}
        />
      </Drawer>
    </>
  );
};

export default CreateRowDrawer;
