import React from 'react';
import cx from 'classnames';
import useGlobalDatasourceUnsavedChanges from '@/_hooks/useGlobalDatasourceUnsavedChanges';
import useScreenReader from '@/modules/common/hooks/useScreenReader';

export const SegregatedList = ({ dataSources, activeDatasourceList, handleOnSelect }) => {
  const { handleActions } = useGlobalDatasourceUnsavedChanges();
  const { speak } = useScreenReader();
  const totalDataSources = dataSources.reduce((acc, filteredGroup) => [...acc, ...filteredGroup.list], []).length;

  const handleCategoryClick = (dataSource) => {
    handleActions(() => handleOnSelect(dataSource.key, dataSource.type));
  };

  const handleCategoryFocus = (dataSource) => {
    speak(`${dataSource.type} category, ${dataSource.list.length} data sources`);
  };

  const handleCategoryKeyDown = (e, dataSource) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      console.log('SegregatedList: KeyDown triggered for', dataSource.type);
      handleActions(() => handleOnSelect(dataSource.key, dataSource.type));
    }
  };

  return (
    <>
      <div className="datasources-info tj-text-xsm datasource-list-header" data-cy="datasource-list-header">
        All data sources {totalDataSources > 0 && `(${totalDataSources - 5})`}
      </div>
      {dataSources
        .filter((ds) => ds.list.length > 0 || ds.type === 'Plugins')
        .map((dataSource, index) => (
          <div
            key={index}
            className={cx('mx-3 rounded-3 datasources-list', {
              'datasources-list-item': activeDatasourceList === dataSource.key,
            })}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label={`${dataSource.type} data sources category`}
              onClick={() => handleCategoryClick(dataSource)}
              onKeyDown={(e) => handleCategoryKeyDown(e, dataSource)}
              onFocus={() => handleCategoryFocus(dataSource)}
              className="col d-flex align-items-center overflow-hidden"
              data-cy={`${dataSource.key
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9-]/g, '')}-datasource-button`}
            >
              <div className="font-400 tj-text-xsm text-truncate" style={{ paddingLeft: '6px' }}>
                {`${dataSource.type} (${dataSource.list.length})`}
              </div>
            </div>
          </div>
        ))}
    </>
  );
};
