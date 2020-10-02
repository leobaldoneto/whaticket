import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";

const useAuth = () => {
	const history = useHistory();
	const [isAuth, setIsAuth] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			api.defaults.headers.Authorization = `Bearer ${JSON.parse(token)}`;
			setIsAuth(true);
			setLoading(false);
		}
		setLoading(false);

		api.interceptors.request.use(
			config => {
				const token = localStorage.getItem("token");
				if (token) {
					config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
				}
				setIsAuth(true);
				return config;
			},
			error => {
				Promise.reject(error);
			}
		);

		api.interceptors.response.use(
			response => {
				return response;
			},
			async error => {
				const originalRequest = error.config;
				if (error.response.status === 403 && !originalRequest._retry) {
					originalRequest._retry = true;

					const { data } = await api.post("/auth/refresh_token");
					if (data) {
						localStorage.setItem("token", JSON.stringify(data.token));
						api.defaults.headers.Authorization = `Bearer ${data.token}`;
					}
					return api(originalRequest);
				}
				if (error.response.status === 401) {
					localStorage.removeItem("token");
					localStorage.removeItem("username");
					localStorage.removeItem("profile");
					localStorage.removeItem("userId");
					api.defaults.headers.Authorization = undefined;
					setIsAuth(false);
				}
				return Promise.reject(error);
			}
		);
	}, []);

	const handleLogin = async (e, user) => {
		// setLoading(true);
		e.preventDefault();
		try {
			const { data } = await api.post("/auth/login", user);
			localStorage.setItem("token", JSON.stringify(data.token));
			localStorage.setItem("username", data.username);
			localStorage.setItem("profile", data.profile);
			localStorage.setItem("userId", data.userId);
			api.defaults.headers.Authorization = `Bearer ${data.token}`;
			setIsAuth(true);
			toast.success(i18n.t("auth.toasts.success"));
			// setLoading(false);
			history.push("/tickets");
		} catch (err) {
			console.log(err);
			if (err.response && err.response.data && err.response.data.error) {
				toast.error(err.response.data.error);
			}
		}
	};

	const handleLogout = e => {
		// setLoading(true);
		e.preventDefault();
		setIsAuth(false);
		localStorage.removeItem("token");
		localStorage.removeItem("username");
		localStorage.removeItem("profile");
		localStorage.removeItem("userId");
		api.defaults.headers.Authorization = undefined;
		// setLoading(false);
		history.push("/login");
	};

	return { isAuth, loading, handleLogin, handleLogout };
};

export default useAuth;
