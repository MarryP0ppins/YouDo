import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Field, Form } from 'react-final-form';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { cn } from '@bem-react/classname';
import { ServiceResponse } from 'api/services/services';
import { PlusIcon } from 'assets';
import { useLoader } from 'hooks/useLoader';
import { useRole } from 'hooks/useRole';
import { FilterFormValues } from 'pages/MainPage/MainPage.types';
import { getServicesAction, getServicesPriceRangeAction } from 'store/actions/services';
import { resetServicesState } from 'store/reducers/services';
import { useAppSelector } from 'store/store';
import { FetchStatus } from 'types/api';

import { PageLoader } from 'components/PageLoader';
import { ServiceCard } from 'components/ServiceCard';

import './MainPage.scss';

const cnMainPage = cn('main-page');

export const MainPage: React.FC = () => {
    const dispatch = useDispatch();

    const [workerServices, setWorkerServices] = useState(false);
    const { services, getServicesStatus, servicesPriceRange, getServicesPriceRangeStatus } = useAppSelector(
        (store) => store.services,
    );
    const { isAuthorized } = useAppSelector((store) => store.user);
    const { user } = useAppSelector((store) => store.user);

    const { isStaff, isWorker } = useRole();

    useLoader([getServicesStatus, getServicesPriceRangeStatus]);

    useEffect(() => {
        if (getServicesStatus === FetchStatus.INITIAL) {
            dispatch(getServicesAction());
        }
    }, [dispatch, getServicesStatus]);

    useEffect(() => {
        if (getServicesPriceRangeStatus === FetchStatus.INITIAL) {
            dispatch(getServicesPriceRangeAction());
        }
    }, [dispatch, getServicesPriceRangeStatus]);

    const handleFormSubmit = useCallback(
        (values: FilterFormValues) =>
            dispatch(
                getServicesAction({
                    title: values?.title,
                    price_min: values?.priceMin,
                    price_max: values?.priceMax,
                }),
            ),
        [dispatch],
    );

    const handleWorkerInterfaceChange = useCallback((myServices: boolean) => () => setWorkerServices(myServices), []);

    const servicesFiltered = useMemo(() => {
        const myServices: ServiceResponse[] = [];
        const otherServices: ServiceResponse[] = [];
        services?.forEach((service) => (service?.user === user?.id ? myServices : otherServices).push(service));
        return { myServices, otherServices };
    }, [services, user?.id]);

    useEffect(
        () => () => {
            dispatch(resetServicesState());
        },
        [dispatch],
    );

    return (
        <div className={cnMainPage()}>
            <PageLoader />
            <Form<FilterFormValues> onSubmit={handleFormSubmit}>
                {({ handleSubmit }) => (
                    <>
                        {servicesPriceRange && (
                            <form onSubmit={handleSubmit} className={cnMainPage('filter-row')}>
                                <Field name="title">
                                    {({ input: input_fields }) => (
                                        <input
                                            {...input_fields}
                                            className={cnMainPage('filter-input')}
                                            type="text"
                                            placeholder="Сфера деятельности"
                                        />
                                    )}
                                </Field>
                                <Field name="priceMin">
                                    {({ input: input_fields }) => {
                                        input_fields.onChange(
                                            input_fields.value < servicesPriceRange.price_min &&
                                                (input_fields.value as string).length
                                                ? servicesPriceRange?.price_min
                                                : input_fields.value,
                                        );
                                        return (
                                            <input
                                                {...input_fields}
                                                className={cnMainPage('filter-input')}
                                                type="number"
                                                placeholder={`Мин. цена ${servicesPriceRange.price_min}руб.`}
                                            />
                                        );
                                    }}
                                </Field>
                                <Field name="priceMax">
                                    {({ input: input_fields }) => {
                                        input_fields.onChange(
                                            input_fields.value > servicesPriceRange?.price_max
                                                ? servicesPriceRange?.price_max
                                                : input_fields.value,
                                        );
                                        return (
                                            <input
                                                {...input_fields}
                                                className={cnMainPage('filter-input')}
                                                type="number"
                                                placeholder={`Макс. цена ${servicesPriceRange.price_max}руб.`}
                                            />
                                        );
                                    }}
                                </Field>
                                <button type="submit" className={cnMainPage('filter-button')}>
                                    Поиск
                                </button>
                            </form>
                        )}
                    </>
                )}
            </Form>
            {isWorker && (
                <div className={cnMainPage('workerInterface')}>
                    <div className={cnMainPage('workerInterface-option')} onClick={handleWorkerInterfaceChange(false)}>
                        Доступные услуги
                    </div>
                    <div className={cnMainPage('workerInterface-option')} onClick={handleWorkerInterfaceChange(true)}>
                        Мои услуги
                    </div>
                </div>
            )}
            <div className={cnMainPage('services-wrapper')}>
                {(workerServices || isStaff) && (
                    <Link
                        to={`/service/create/`}
                        className={cnMainPage('link', { disabled: !isAuthorized, create: true })}
                    >
                        <PlusIcon />
                    </Link>
                )}
                {(isWorker
                    ? workerServices
                        ? servicesFiltered.myServices
                        : servicesFiltered.otherServices
                    : services
                ).map((service, serviceIndex) => (
                    <Link
                        key={serviceIndex}
                        to={`/service/${service.id}`}
                        className={cnMainPage('link')}
                    >
                        <ServiceCard serviceInfo={service} canEdit={workerServices || isStaff} />
                    </Link>
                ))}
            </div>
        </div>
    );
};
